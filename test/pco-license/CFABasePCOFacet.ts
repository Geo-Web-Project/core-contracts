import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, getNamedAccounts } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "./CFABasePCO.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("CFABasePCOFacet", async function () {
  before(async () => {
    await Fixtures.setup();
  });

  describe("initializeBid", async () => {
    it("should initialize bid", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppToBeneficiaryFlow,
        checkAppNetFlow,
        checkAppBalance,
      } = await Fixtures.setup();
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

      await expect(txn)
        .to.emit(basePCOFacet, "PayerContributionRateUpdated")
        .withArgs(user, contributionRate);
      await expect(txn)
        .to.emit(basePCOFacet, "PayerForSalePriceUpdated")
        .withArgs(user, forSalePrice);
      expect(await basePCOFacet.license()).to.equal(mockLicense.address);
      expect(await basePCOFacet.licenseId()).to.equal(1);
      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(contributionRate);
      expect(await basePCOFacet.forSalePrice()).to.equal(forSalePrice);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(user, contributionRate);
      await checkAppToBeneficiaryFlow(contributionRate);
      await checkAppNetFlow();
      await checkAppBalance(0);
    });

    it("should fail if not contract owner", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.setup();
      const { user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      // Transfer payment token for buffer
      const op1 = paymentToken.transfer({
        receiver: basePCOFacet.address,
        amount: forSalePrice.toString(),
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

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .initializeBid(
          mockCFABeneficiary.address,
          mockParamsStore.address,
          mockLicense.address,
          1,
          user,
          contributionRate,
          forSalePrice
        );
      await expect(txn).to.be.revertedWith(
        "NotContractOwner"
      );
    });

    it("should fail if buffer is missing", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.setup();
      const { user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      // Approve flow creation
      const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op2.exec(await ethers.getSigner(user));

      const txn = basePCOFacet.initializeBid(
        mockCFABeneficiary.address,
        mockParamsStore.address,
        mockLicense.address,
        1,
        user,
        contributionRate,
        forSalePrice
      );
      await expect(txn).to.be.revertedWith("CFA: not enough available balance");
    });

    it("should fail if flow permissions are missing", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        paymentToken,
      } = await Fixtures.setup();
      const { user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      // Transfer payment token for buffer
      const op1 = paymentToken.transfer({
        receiver: basePCOFacet.address,
        amount: forSalePrice.toString(),
      });
      await op1.exec(await ethers.getSigner(user));

      const txn = basePCOFacet.initializeBid(
        mockCFABeneficiary.address,
        mockParamsStore.address,
        mockLicense.address,
        1,
        user,
        contributionRate,
        forSalePrice
      );
      await expect(txn).to.be.revertedWith("CFA: E_NO_OPERATOR_CREATE_FLOW");
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.setup();
      const { user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      // Transfer payment token for buffer
      const op1 = paymentToken.transfer({
        receiver: basePCOFacet.address,
        amount: forSalePrice.toString(),
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

      const txn = basePCOFacet.initializeBid(
        mockCFABeneficiary.address,
        mockParamsStore.address,
        mockLicense.address,
        1,
        user,
        contributionRate.add(10),
        forSalePrice
      );
      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Incorrect for sale price"
      );
    });

    it("should fail if for sale price does not meet minimum", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockCFABeneficiary,
        mockLicense,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.setup();
      const { user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      mockParamsStore.getMinForSalePrice.returns(forSalePrice.add(1000));

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

      const txn = basePCOFacet.initializeBid(
        mockCFABeneficiary.address,
        mockParamsStore.address,
        mockLicense.address,
        1,
        user,
        contributionRate,
        forSalePrice
      );
      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Minimum for sale price not met"
      );

      mockParamsStore.getMinForSalePrice.returns(0);
    });
  });

  describe("payer decreases flow", async () => {
    it("should not update forSalePrice or contributionRate", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const contributionRate = await basePCOFacet.contributionRate();
      const forSalePrice = await basePCOFacet.forSalePrice();

      const op = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        flowRate: contributionRate.sub(10).toString(),
        superToken: ethx_erc20.address,
      });

      await op.exec(await ethers.getSigner(user));

      expect(await basePCOFacet.forSalePrice()).to.equal(forSalePrice);
      expect(await basePCOFacet.contributionRate()).to.equal(contributionRate);
    });

    it("should deplete buffer", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20, mockCFABeneficiary } =
        await Fixtures.initialized();
      const { user, diamondAdmin } = await getNamedAccounts();

      const contributionRate = await basePCOFacet.contributionRate();

      const op = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        flowRate: contributionRate.sub(99).toString(),
        superToken: ethx_erc20.address,
      });

      await op.exec(await ethers.getSigner(user));

      const accountInfo = await ethersjsSf.cfaV1.getAccountFlowInfo({
        account: basePCOFacet.address,
        superToken: ethx_erc20.address,
        providerOrSigner: await ethers.getSigner(diamondAdmin),
      });
      expect(Number(accountInfo.flowRate)).to.be.lessThan(0);

      // Close flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: basePCOFacet.address,
        receiver: mockCFABeneficiary.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(diamondAdmin));
      await op1Resp.wait();

      expect(await basePCOFacet.contributionRate()).to.equal(0);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(false);
      expect(await basePCOFacet.forSalePrice()).to.equal(0);
    });
  });

  describe("payer increases flow", async () => {
    it("should not update forSalePrice or contributionRate", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const contributionRate = await basePCOFacet.contributionRate();
      const forSalePrice = await basePCOFacet.forSalePrice();

      const op = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        flowRate: contributionRate.add(10).toString(),
        superToken: ethx_erc20.address,
      });

      await op.exec(await ethers.getSigner(user));

      expect(await basePCOFacet.forSalePrice()).to.equal(forSalePrice);
      expect(await basePCOFacet.contributionRate()).to.equal(contributionRate);
    });

    it("should accumulate buffer", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await Fixtures.initialized();
      const { user, diamondAdmin } = await getNamedAccounts();

      const contributionRate = await basePCOFacet.contributionRate();
      const forSalePrice = await basePCOFacet.forSalePrice();

      const op = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        flowRate: contributionRate.add(100).toString(),
        superToken: ethx_erc20.address,
      });

      await op.exec(await ethers.getSigner(user));

      const accountInfo = await ethersjsSf.cfaV1.getAccountFlowInfo({
        account: basePCOFacet.address,
        superToken: ethx_erc20.address,
        providerOrSigner: await ethers.getSigner(diamondAdmin),
      });
      expect(Number(accountInfo.flowRate)).to.be.greaterThan(0);

      expect(await basePCOFacet.contributionRate()).to.equal(contributionRate);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.forSalePrice()).to.equal(forSalePrice);
    });
  });
});
