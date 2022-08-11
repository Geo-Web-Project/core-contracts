import { web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
import { BigNumber, BigNumberish } from "ethers";
import { expect } from "chai";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { smock } from "@defi-wonderland/smock";
import { deployments, getUnnamedAccounts } from "hardhat";
import { IERC721, ISuperfluid } from "../../typechain-types";
import {
  perYearToPerSecondRate,
  errorHandler,
  rateToPurchasePrice,
  setupSf,
} from "../shared";

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await setupSf();
    const { sf, ethersjsSf, paymentToken } = res;

    const { diamondAdmin } = await getNamedAccounts();
    const { diamond } = deployments;
    await diamond.deploy("TestBasePCO", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    const accounts = await ethers.getSigners();

    const [admin] = accounts;

    const basePCOFacet = await ethers.getContract("TestBasePCO", diamondAdmin);

    let mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
    mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
    mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
    mockParamsStore.getPenaltyNumerator.returns(numerator);
    mockParamsStore.getPenaltyDenominator.returns(denominator);
    mockParamsStore.getHost.returns(sf.host.address);
    mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
    mockParamsStore.getBeneficiary.returns(diamondAdmin);
    mockParamsStore.getBidPeriodLengthInSeconds.returns(60 * 60 * 24);

    let mockLicense = await smock.fake<IERC721>("IERC721");

    async function checkUserToAppFlow(
      _user: string,
      expectedAmount: BigNumber
    ) {
      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: paymentToken.address,
        sender: _user,
        receiver: basePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(userToAppFlow.flowRate).to.equal(
        expectedAmount.toString(),
        "User -> App flow is incorrect"
      );
    }

    async function checkAppToBeneficiaryFlow(expectedAmount: BigNumber) {
      const appToBeneficiaryFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: paymentToken.address,
        sender: basePCOFacet.address,
        receiver: admin.address,
        providerOrSigner: admin,
      });

      expect(appToBeneficiaryFlow.flowRate).to.equal(
        expectedAmount.toString(),
        "App -> Beneficiary flow is incorrect"
      );
    }

    async function checkAppNetFlow(check?: BigNumberish) {
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: paymentToken.address,
        account: basePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(appNetFlow).to.equal(
        check?.toString() ?? "0",
        "App net flow is incorrect"
      );
    }

    async function checkAppBalance(check: BigNumberish) {
      const appBalance = await paymentToken.balanceOf({
        account: basePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(appBalance).to.equal(check.toString(), "App balance is incorrect");
    }

    return {
      basePCOFacet,
      mockParamsStore,
      mockLicense,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      ...res,
    };
  }
);

const initialized = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await setup();
    const {
      basePCOFacet,
      mockParamsStore,
      mockLicense,
      ethersjsSf,
      paymentToken,
    } = res;

    const { user } = await getNamedAccounts();

    const contributionRate = BigNumber.from(100);
    const forSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      contributionRate
    );

    // Transfer payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const op1 = await paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: requiredBuffer.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockParamsStore.address,
      mockLicense.address,
      1,
      user,
      contributionRate,
      forSalePrice
    );
    await txn.wait();

    return res;
  }
);

const afterPayerDelete = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await initialized();
    const { basePCOFacet, ethersjsSf, ethx_erc20 } = res;

    const { user, diamondAdmin } = await getNamedAccounts();

    // Payer deletes flow
    const op1 = await ethersjsSf.cfaV1.deleteFlow({
      sender: user,
      receiver: basePCOFacet.address,
      superToken: ethx_erc20.address,
    });

    const op1Resp = await op1.exec(await ethers.getSigner(user));
    await op1Resp.wait();

    // Simulate closing flow
    const op2 = await ethersjsSf.cfaV1.deleteFlow({
      sender: basePCOFacet.address,
      receiver: diamondAdmin,
      superToken: ethx_erc20.address,
    });

    const op2Resp = await op2.exec(await ethers.getSigner(diamondAdmin));
    await op2Resp.wait();

    return res;
  }
);

export default { setup, initialized, afterPayerDelete };
