import { BigNumber, BigNumberish } from "ethers";
import { expect } from "chai";
import { smock } from "@defi-wonderland/smock";
import { deployments } from "hardhat";
import {
  IERC721,
  PCOLicenseClaimerFacet,
  PCOLicenseParamsFacet,
  PCOERC721Facet,
} from "../../typechain-types";
import {
  perYearToPerSecondRate,
  fromValueToRate,
  rateToPurchasePrice,
  setupSf,
} from "../shared";
import { deployDiamond } from "../../scripts/deploy";

const setup = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setupSf();
    const { sf, ethersjsSf, paymentToken } = res;

    const { diamondAdmin } = await getNamedAccounts();
    const basePCOFacet = await deployDiamond("PCOLicenseDiamond", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: [
        "CFABasePCOFacet",
        "TestableCFABasePCOFacet",
        "CFAPenaltyBidFacet",
        "CFAReclaimerFacet",
        "DiamondLoupeFacet",
      ],
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    const accounts = await ethers.getSigners();

    const [admin] = accounts;

    const mockCFABeneficiary = await smock.fake("ICFABeneficiary");
    const mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
    mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
    mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
    mockParamsStore.getPenaltyNumerator.returns(numerator);
    mockParamsStore.getPenaltyDenominator.returns(denominator);
    mockParamsStore.getHost.returns(sf.host.address);
    mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
    mockParamsStore.getBeneficiary.returns(mockCFABeneficiary);
    mockParamsStore.getBidPeriodLengthInSeconds.returns(60 * 60 * 24);
    mockParamsStore.getReclaimAuctionLength.returns(14 * 60 * 60 * 24);
    mockParamsStore.getMinForSalePrice.returns(0);

    const mockLicense = await smock.fake<IERC721>("IERC721");

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
        receiver: mockCFABeneficiary.address,
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
      mockCFABeneficiary,
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
  async ({ getNamedAccounts, ethers }) => {
    const res = await setup();
    const {
      basePCOFacet,
      mockParamsStore,
      mockCFABeneficiary,
      mockLicense,
      ethersjsSf,
      paymentToken,
    } = res;

    const { user } = await getNamedAccounts();

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
    mockParamsStore.getPerSecondFeeDenominator.returns(denominator);

    const contributionRate = BigNumber.from(100);
    const forSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      contributionRate
    );

    // Transfer payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const op1 = paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: requiredBuffer.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockCFABeneficiary.address,
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

const initializedLarge = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setup();
    const {
      basePCOFacet,
      mockParamsStore,
      mockCFABeneficiary,
      mockLicense,
      ethersjsSf,
      paymentToken,
    } = res;

    const { user } = await getNamedAccounts();

    const contributionRate = BigNumber.from(200000000);
    const forSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      contributionRate
    );

    // Transfer payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const op1 = paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: requiredBuffer.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockCFABeneficiary.address,
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

const initializedWithRealLicense = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setup();
    const {
      basePCOFacet,
      ethersjsSf,
      paymentToken,
      ethx_erc20,
      sf,
      mockCFABeneficiary,
    } = res;

    const { diamondAdmin } = await getNamedAccounts();
    const erc721Facet = await deployDiamond("RegistryDiamond", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: [
        "PCOLicenseClaimerFacet",
        "GeoWebParcelFacet",
        "PCOLicenseParamsFacet",
        "PCOERC721Facet",
      ],
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    await (erc721Facet as PCOERC721Facet).initializeERC721(
      "Geo Web License Test",
      "GEOL",
      ""
    );

    await (erc721Facet as PCOLicenseClaimerFacet).initializeClaimer(
      0,
      0,
      0,
      0,
      basePCOFacet.address
    );

    await (erc721Facet as PCOLicenseParamsFacet).initializeParams(
      mockCFABeneficiary.address,
      ethx_erc20.address,
      sf.host.address,
      numerator,
      denominator,
      numerator,
      denominator,
      60 * 60 * 24,
      60 * 60 * 24,
      0
    );

    const { user } = await getNamedAccounts();

    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    const contributionRate = ethers.utils
      .parseEther("9")
      .div(365 * 24 * 60 * 60 * 10);
    const forSalePrice = await rateToPurchasePrice(
      erc721Facet,
      contributionRate
    );

    // Approve payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const approveOp = paymentToken.approve({
      receiver: erc721Facet.address,
      amount: requiredBuffer.toString(),
    });
    await approveOp.exec(await ethers.getSigner(user));

    // Approve flow creation
    const nextAddress = await (
      erc721Facet as PCOLicenseClaimerFacet
    ).getNextProxyAddress(user);
    const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: nextAddress,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await (erc721Facet as PCOLicenseClaimerFacet)
      .connect(await ethers.getSigner(user))
      .claim(contributionRate, forSalePrice, coord, [BigNumber.from(0)]);

    await txn.wait();

    const newBasePCOFacet = basePCOFacet.attach(nextAddress);

    const accounts = await ethers.getSigners();

    const [admin] = accounts;

    async function checkUserToAppFlow(
      _user: string,
      expectedAmount: BigNumber
    ) {
      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: paymentToken.address,
        sender: _user,
        receiver: newBasePCOFacet.address,
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
        sender: newBasePCOFacet.address,
        receiver: mockCFABeneficiary.address,
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
        account: newBasePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(appNetFlow).to.equal(
        check?.toString() ?? "0",
        "App net flow is incorrect"
      );
    }

    async function checkAppBalance(check: BigNumberish) {
      const appBalance = await paymentToken.balanceOf({
        account: newBasePCOFacet.address,
        providerOrSigner: admin,
      });

      expect(appBalance).to.equal(check.toString(), "App balance is incorrect");
    }

    return {
      ...res,
      basePCOFacet: newBasePCOFacet,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
    };
  }
);

const initializedExtremeFeeDuring = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setup();
    const {
      basePCOFacet,
      mockParamsStore,
      mockLicense,
      ethersjsSf,
      paymentToken,
      mockCFABeneficiary,
    } = res;

    // 100% in an hour
    mockParamsStore.getPerSecondFeeNumerator.returns(2778 * 100);
    mockParamsStore.getPerSecondFeeDenominator.returns(100000);

    const { user } = await getNamedAccounts();

    const forSalePrice = BigNumber.from(50000);
    const contributionRate = await fromValueToRate(
      mockParamsStore,
      forSalePrice
    );

    // Transfer payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const op1 = paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: requiredBuffer.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockCFABeneficiary.address,
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

const initializedExtremeFeeAfter = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setup();
    const {
      basePCOFacet,
      mockParamsStore,
      mockLicense,
      ethersjsSf,
      paymentToken,
      mockCFABeneficiary,
    } = res;

    // 100% in 25 hours
    mockParamsStore.getPerSecondFeeNumerator.returns(900 * 100);
    mockParamsStore.getPerSecondFeeDenominator.returns(100000);

    const { user } = await getNamedAccounts();

    const forSalePrice = BigNumber.from(50000);
    const contributionRate = await fromValueToRate(
      mockParamsStore,
      forSalePrice
    );

    // Transfer payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const op1 = paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: requiredBuffer.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockCFABeneficiary.address,
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
  async ({ getNamedAccounts, ethers }) => {
    const res = await initialized();
    const { basePCOFacet, ethersjsSf, ethx_erc20, mockCFABeneficiary } = res;

    const { user, diamondAdmin } = await getNamedAccounts();

    // Payer deletes flow
    const op1 = ethersjsSf.cfaV1.deleteFlow({
      sender: user,
      receiver: basePCOFacet.address,
      superToken: ethx_erc20.address,
    });

    const op1Resp = await op1.exec(await ethers.getSigner(user));
    await op1Resp.wait();

    // Simulate closing flow
    const op2 = ethersjsSf.cfaV1.deleteFlow({
      sender: basePCOFacet.address,
      receiver: mockCFABeneficiary.address,
      superToken: ethx_erc20.address,
    });

    const op2Resp = await op2.exec(await ethers.getSigner(diamondAdmin));
    const op2Receipt = await op2Resp.wait();
    const txnBlock = await ethers.provider.getBlock(op2Receipt.blockNumber);

    mockCFABeneficiary.getLastDeletion.returns(txnBlock.timestamp);

    return res;
  }
);

export default {
  setup,
  initialized,
  initializedLarge,
  initializedWithRealLicense,
  initializedExtremeFeeDuring,
  initializedExtremeFeeAfter,
  afterPayerDelete,
};
