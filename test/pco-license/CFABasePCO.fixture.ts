import { web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
import { BigNumber } from "ethers";
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
} from "../shared";

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture();
    const { diamondAdmin } = await getNamedAccounts();
    const { diamond } = deployments;
    await diamond.deploy("TestBasePCO", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    const basePCOFacet = await ethers.getContract("TestBasePCO", diamondAdmin);

    const accounts = await ethers.getSigners();

    const [admin, user, bidder, other] = accounts;
    const uAccounts = await getUnnamedAccounts();

    await deployFramework(errorHandler, {
      web3,
      from: admin.address,
    });

    await deploySuperToken(errorHandler, [":", "ETH"], {
      web3,
      from: admin.address,
    });

    const sf = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: ["ETH"],
    });
    await sf.initialize();

    const ethersProvider = admin.provider!;
    const ethersjsSf: Framework = await Framework.create({
      chainId: 31337,
      resolverAddress: sf.resolver.address,
      protocolReleaseVersion: "test",
      provider: ethersProvider,
    });

    const ethx = await ethersjsSf.loadSuperToken(sf.tokens.ETHx.address);
    const ethx_erc20 = await ethers.getContractAt(
      "IERC20",
      sf.tokens.ETHx.address
    );
    const hostContract: ISuperfluid = await ethers.getContractAt(
      "ISuperfluid",
      sf.host.address
    );

    await sf.tokens.ETHx.upgradeByETH({
      from: user.address,
      value: ethers.utils.parseEther("10"),
    });

    await sf.tokens.ETHx.upgradeByETH({
      from: bidder.address,
      value: ethers.utils.parseEther("10"),
    });

    await sf.tokens.ETHx.upgradeByETH({
      from: uAccounts[3],
      value: ethers.utils.parseEther("10"),
    });

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
        superToken: ethx.address,
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
        superToken: ethx.address,
        sender: basePCOFacet.address,
        receiver: admin.address,
        providerOrSigner: admin,
      });

      expect(appToBeneficiaryFlow.flowRate).to.equal(
        expectedAmount.toString(),
        "App -> Beneficiary flow is incorrect"
      );
    }

    async function checkAppNetFlow() {
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: ethx.address,
        account: basePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(appNetFlow).to.equal("0", "App net flow is incorrect");
    }

    return {
      basePCOFacet,
      mockParamsStore,
      mockLicense,
      paymentToken: ethx,
      ethx_erc20,
      ethersjsSf,
      sf,
      hostContract,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
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
    const op1 = await paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: forSalePrice.toString(),
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

export default { setup, initialized };
