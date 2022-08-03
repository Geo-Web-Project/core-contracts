import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { getNamedAccounts } from "hardhat";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "./CFABasePCO.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("CFABasePCOFacet", async function () {
  //   async function calculatePenaltyAmount(rate: BigNumber) {
  //     const penaltyNumerator = await superApp.penaltyNumerator();
  //     const penaltyDenominator = await superApp.penaltyDenominator();

  //     return rate.mul(penaltyNumerator).div(penaltyDenominator);
  //   }

  before(async () => {
    await Fixtures.setup();
  });

  describe("initializeBid", async () => {
    it("should initialize bid", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        mockLicense,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppToBeneficiaryFlow,
        checkAppNetFlow,
      } = await Fixtures.setup();
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
    });

    it("should fail if not contract owner", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
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

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .initializeBid(
          mockParamsStore.address,
          mockLicense.address,
          1,
          user,
          contributionRate,
          forSalePrice
        );
      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });

    it("should fail if buffer is missing", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
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
      const op2 = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op2.exec(await ethers.getSigner(user));

      const txn = basePCOFacet.initializeBid(
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
      const { basePCOFacet, mockParamsStore, mockLicense, paymentToken } =
        await Fixtures.setup();
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

      const txn = basePCOFacet.initializeBid(
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

      const txn = basePCOFacet.initializeBid(
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
  });

  describe("editBid", async () => {
    it("should edit bid", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "PayerContributionRateUpdated")
        .withArgs(user, newContributionRate);
      await expect(txn)
        .to.emit(basePCOFacet, "PayerForSalePriceUpdated")
        .withArgs(user, newForSalePrice);
      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        newContributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(newForSalePrice);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(user, newContributionRate);
      await checkAppToBeneficiaryFlow(newContributionRate);
      await checkAppNetFlow();
    });

    it("should fail if not payer", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet.editBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Only payer is allowed to perform this action"
      );
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .add(10)
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate.add(10), newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Incorrect for sale price"
      );
    });
  });
});
