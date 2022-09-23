import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, getUnnamedAccounts, network } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { getNamedAccounts } from "hardhat";
import { rateToPurchasePrice } from "../shared";
import BaseFixtures from "./CFABasePCO.fixture";
import CFAPenaltyBidFixtures from "./CFAPenaltyBid.fixture";
import CFABasePCOFixture from "./CFABasePCO.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("CFAPenaltyBidFacet", async function () {
  before(async () => {
    await BaseFixtures.initialized();
  });

  describe("hasPendingBid", async () => {
    it("should have after initialization", async () => {
      const { basePCOFacet } = await BaseFixtures.initialized();

      expect(await basePCOFacet.hasPendingBid()).to.equal(false);
    });

    it("should have after place bid", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterPlaceBid();

      expect(await basePCOFacet.hasPendingBid()).to.equal(true);
    });

    it("should have after decreasing flow allowance", async () => {
      const { basePCOFacet, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();

      // Revoke permissions
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: "0",
      });
      await op.exec(await ethers.getSigner(bidder));

      expect(await basePCOFacet.hasPendingBid()).to.equal(true);
    });

    it("should have after revoking full control", async () => {
      const { basePCOFacet, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();

      // Revoke permissions
      const op = ethersjsSf.cfaV1.revokeFlowOperatorWithFullControl({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
      });
      await op.exec(await ethers.getSigner(bidder));

      expect(await basePCOFacet.hasPendingBid()).to.equal(true);
    });
  });

  describe("editBid", async () => {
    it("should increase bid", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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

    it("should decrease bid", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await BaseFixtures.initializedLarge();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(100);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: existingContributionRate
          .sub(newContributionRate)
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

    it("should edit bid after payer delete", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow create
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
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
        await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
        await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
        "LibCFABasePCO: Incorrect for sale price"
      );
    });

    it("should fail if has pending bid", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Pending bid exists"
      );
    });

    it("should fail if missing flow permissions", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve buffer deposit
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith("E_NO_OPERATOR_UPDATE_FLOW");
    });

    it("should fail if missing buffer transfer allowance", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });
  });

  describe("placeBid", async () => {
    it("should place bid with create permissions", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await BaseFixtures.initialized();
      const { user, bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidPlaced")
        .withArgs(bidder, newContributionRate, newForSalePrice);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(bidder, basePCOFacet.address, totalCollateral);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.bidder).to.equal(bidder);
      expect(pendingBid.contributionRate).to.equal(newContributionRate);
      expect(pendingBid.forSalePrice).to.equal(newForSalePrice);
      await checkUserToAppFlow(user, await basePCOFacet.contributionRate());
      await checkAppToBeneficiaryFlow(await basePCOFacet.contributionRate());
      await checkAppNetFlow();
    });

    it("should place bid with full control", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
      } = await BaseFixtures.initialized();
      const { user, bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = ethersjsSf.cfaV1.authorizeFlowOperatorWithFullControl({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidPlaced")
        .withArgs(bidder, newContributionRate, newForSalePrice);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(bidder, basePCOFacet.address, totalCollateral);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.bidder).to.equal(bidder);
      expect(pendingBid.contributionRate).to.equal(newContributionRate);
      expect(pendingBid.forSalePrice).to.equal(newForSalePrice);
      await checkUserToAppFlow(user, await basePCOFacet.contributionRate());
      await checkAppToBeneficiaryFlow(await basePCOFacet.contributionRate());
      await checkAppNetFlow();
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate.add(10), newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Incorrect for sale price"
      );
    });

    it("should fail if missing flow permissions", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: CREATE_FLOW permission not granted"
      );
    });

    it("should fail if flow allowance is not enough", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.sub(1).toString(),
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: CREATE_FLOW permission does not have enough allowance"
      );
    });

    it("should fail if deposit allowance is not enough", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if pending bid exists", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const accounts = await getUnnamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(accounts[3]))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(accounts[3]));

      // Approve flow update
      const op1 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op1.exec(await ethers.getSigner(accounts[3]));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(accounts[3]))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Pending bid already exists"
      );
    });

    it("should fail if payer bid is inactive", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.afterPayerDelete();
      const accounts = await getUnnamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(accounts[3]))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(accounts[3]));

      // Approve flow update
      const op1 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op1.exec(await ethers.getSigner(accounts[3]));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(accounts[3]))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Can only perform action when payer bid is active"
      );
    });

    it("should fail if for sale price is too low", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(50);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(bidder));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: New contribution rate is not high enough"
      );
    });

    it("should fail if payer is bidder", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const accounts = await getUnnamedAccounts();
      const { user } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200000000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(accounts[3]))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          newContributionRate
        );
      const totalCollateral = newForSalePrice.add(requiredBuffer);

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: totalCollateral.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op1 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op1.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .placeBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Payer is not allowed to perform this action"
      );
    });
  });

  describe("acceptBid", async () => {
    it("should accept bid", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidAccepted")
        .withArgs(user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, forSalePrice.add(oldBuffer));
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should accept bid if bidder revokes permissions", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBidAndBidderRevokes();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidAccepted")
        .withArgs(user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, forSalePrice.add(oldBuffer));
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow(-200000000);
    });

    it("should fail if payer has increased flow manually", async () => {
      const { basePCOFacet, mockLicense } =
        await CFAPenaltyBidFixtures.afterPlaceBidAndSurplus();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { user } = await getNamedAccounts();
      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if pending bid does not exist", async () => {
      const { basePCOFacet } = await CFABasePCOFixture.initialized();
      const { user } = await getNamedAccounts();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Pending bid does not exist"
      );
    });

    it("should fail if bidding period has elapsed", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterPlaceBid();
      const { user } = await getNamedAccounts();

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if not payer", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Only payer is allowed to perform this action"
      );
    });

    it("should fail if payer bid becomes inactive", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20, mockCFABeneficiary } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Simulate closing flow
      await basePCOFacet.manualDeleteFlow(mockCFABeneficiary.address);

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer deletes bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer decreases bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const { user } = await getNamedAccounts();

      // Payer decreases flow
      const op1 = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
        flowRate: existingContributionRate.sub(1).toString(),
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer deletes and reopens bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Payer re-opens flow
      const op2 = ethersjsSf.cfaV1.createFlow({
        receiver: basePCOFacet.address,
        flowRate: existingContributionRate,
        superToken: ethx_erc20.address,
      });

      const op2Resp = await op2.exec(await ethers.getSigner(user));
      await op2Resp.wait();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .acceptBid();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });
  });

  describe("rejectBid", async () => {
    it("should reject bid during period", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        mockCFABeneficiary,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, mockCFABeneficiary.address, penaltyPayment);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer.sub(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should reject bid with higher contribution rate", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
        mockParamsStore,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      const newContributionRate = oldPendingBid.contributionRate.add(10000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
        .rejectBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, mockCFABeneficiary.address, penaltyPayment);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer.sub(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        newContributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(newForSalePrice);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, newContributionRate);
      await checkAppToBeneficiaryFlow(newContributionRate);
      await checkAppNetFlow();
    });

    it("should reject bid if deposit is somehow depleted", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBidExtremeFeeDuring();

      const { bidder, user, other } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .add(newBuffer)
          .add(oldPendingBid.forSalePrice)
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      // Outgoing flow is somehow created
      await basePCOFacet.manualCreateFlow(other, existingContributionRate);

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 23]);
      await network.provider.send("evm_mine");

      // Delete extra flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        receiver: other,
        sender: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      await op1.exec(await ethers.getSigner(other));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(3);
      expect(toBidderTransfers.length).to.be.equal(1);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, mockCFABeneficiary.address, penaltyPayment);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          user,
          basePCOFacet.address,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should reject bid if balance is somehow depleted to 0", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user, diamondAdmin } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Balance is somehow depleted to 0
      await basePCOFacet.manualTransfer(
        diamondAdmin,
        oldPendingBid.forSalePrice.add(newBuffer)
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(newBuffer)
          .add(oldPendingBid.forSalePrice)
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(3);
      expect(toBidderTransfers.length).to.be.equal(1);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, mockCFABeneficiary.address, penaltyPayment);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer.sub(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          user,
          basePCOFacet.address,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should reject bid if balance is somehow depleted to between 0 and bidder payment", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user, diamondAdmin } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Balance is somehow depleted to below bidder payment
      await basePCOFacet.manualTransfer(
        diamondAdmin,
        oldPendingBid.forSalePrice
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(oldPendingBid.forSalePrice)
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(3);
      expect(toBidderTransfers.length).to.be.equal(1);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer.sub(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, oldPendingBid.forSalePrice);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should reject bid and refund surplus", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        paymentToken,
        ethx_erc20,
        ethersjsSf,
        checkAppBalance,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Surplus is transferred
      const transferOp = paymentToken.transfer({
        receiver: basePCOFacet.address,
        amount: "100",
      });
      await transferOp.exec(await ethers.getSigner(user));

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(oldPendingBid.forSalePrice)
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidRejected")
        .withArgs(user, bidder, forSalePrice);

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(basePCOFacet.address, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(1);
      expect(fromUserTransfers.length).to.be.equal(2);
      expect(toBidderTransfers.length).to.be.equal(1);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, mockCFABeneficiary.address, penaltyPayment);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, basePCOFacet.address, newBuffer.sub(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, BigNumber.from(100));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.add(newBuffer)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkUserToAppFlow(user, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should fail if payer increases flow manually", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBidAndSurplus();

      const { user } = await getNamedAccounts();
      const existingContributionRate = await basePCOFacet.contributionRate();

      const penaltyPayment = await basePCOFacet.calculatePenalty();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if contribution rate is too low", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf, mockParamsStore } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      const newContributionRate = oldPendingBid.contributionRate.sub(10000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(newContributionRate, newForSalePrice);

      await expect(txn).to.be.revertedWith(
        "LibCFAPenaltyBid: New contribution rate must be >= pending bid"
      );
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf, mockParamsStore } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      const newContributionRate = oldPendingBid.contributionRate.add(1000);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        oldPendingBid.contributionRate
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: newContributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(newContributionRate, newForSalePrice);
      await expect(txn).to.be.revertedWith(
        "LibCFABasePCO: Incorrect for sale price"
      );
    });

    it("should fail if payer bid becomes inactive", async () => {
      const {
        basePCOFacet,
        ethersjsSf,
        ethx_erc20,
        paymentToken,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Simulate closing flow
      await basePCOFacet.manualDeleteFlow(mockCFABeneficiary.address);

      const estimatedTimeSinceDeletion = 60;
      const estimatedDepletedBuffer = existingContributionRate.mul(
        estimatedTimeSinceDeletion
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(estimatedDepletedBuffer.mul(2)) // Add extra to cover approve txns
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 3,
        flowRateAllowance: oldPendingBid.contributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);
      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer deletes bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Advance time
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.send("evm_mine");

      const estimatedTimeSinceDeletion = 60;
      const estimatedDepletedBuffer = existingContributionRate.mul(
        estimatedTimeSinceDeletion
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(estimatedDepletedBuffer.mul(2)) // Add extra to cover approve txns
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 3,
        flowRateAllowance: oldPendingBid.contributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer decreases bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Payer decreases flow
      const op1 = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
        flowRate: existingContributionRate.sub(1).toString(),
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Advance time
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.send("evm_mine");

      const estimatedTimeSinceDeletion = 60;
      const estimatedDepletedBuffer = existingContributionRate.mul(
        estimatedTimeSinceDeletion
      );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(estimatedDepletedBuffer.mul(2)) // Add extra to cover approve txns
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 3,
        flowRateAllowance: oldPendingBid.contributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if payer deletes and reopens bid", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment: BigNumber = await basePCOFacet.calculatePenalty();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      // Advance time
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.send("evm_mine");

      const estimatedTimeSinceDeletion = 60;
      const estimatedDepletedBuffer = existingContributionRate.mul(
        estimatedTimeSinceDeletion
      );

      // Payer re-opens flow
      const op2 = ethersjsSf.cfaV1.createFlow({
        receiver: basePCOFacet.address,
        flowRate: existingContributionRate,
        superToken: ethx_erc20.address,
      });

      const op2Resp = await op2.exec(await ethers.getSigner(user));
      await op2Resp.wait();

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment
          .add(newBuffer)
          .sub(oldBuffer)
          .add(estimatedDepletedBuffer.mul(2)) // Add extra to cover approve txns
          .toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 3,
        flowRateAllowance: oldPendingBid.contributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if not payer", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { bidder, user } = await getNamedAccounts();

      const penaltyPayment = await basePCOFacet.calculatePenalty();
      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();

      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Only payer is allowed to perform this action"
      );
    });

    it("should fail if no pending bid", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterAcceptBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment = await basePCOFacet.calculatePenalty();
      const oldPendingBid = await basePCOFacet.pendingBid();

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate.toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFABasePCOFacet: Only payer is allowed to perform this action"
      );
    });

    it("should fail if missing flow permissions", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment = await basePCOFacet.calculatePenalty();
      const oldPendingBid = await basePCOFacet.pendingBid();

      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith("E_NO_OPERATOR_UPDATE_FLOW");
    });

    it("should fail if not enough allowance for penalty", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if bid period has elapsed", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const penaltyPayment = await basePCOFacet.calculatePenalty();
      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();

      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );
      const newBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldPendingBid.contributionRate
        );

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.add(newBuffer).sub(oldBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has elapsed"
      );
    });

    it("should fail if not enough allowance for buffer", async () => {
      const { basePCOFacet, paymentToken, ethersjsSf } =
        await CFAPenaltyBidFixtures.afterPlaceBid();

      const { user } = await getNamedAccounts();

      const existingContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const penaltyPayment = await basePCOFacet.calculatePenalty();

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: penaltyPayment.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow update
      const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 2,
        flowRateAllowance: oldPendingBid.contributionRate
          .sub(existingContributionRate)
          .toString(),
      });
      await op.exec(await ethers.getSigner(user));

      const txn = basePCOFacet
        .connect(await ethers.getSigner(user))
        .rejectBid(oldPendingBid.contributionRate, oldPendingBid.forSalePrice);

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });
  });

  describe("triggerTransfer", async () => {
    it("should trigger transfer after bidding period elapsed", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, forSalePrice.add(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer after bidding period elapsed and bidder revokes permissions", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBidAndBidderRevokes();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, forSalePrice.add(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(true);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow(-200000000);
    });

    it("should trigger transfer after bidding period elapsed and then flow is deleted", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        checkAppBalance,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnResp = await txn.wait();
      const txnBlock = await ethers.provider.getBlock(txnResp.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = txnBlock.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer after bidding period elapsed and then flow is decreased", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        checkAppBalance,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      // Payer decreases flow
      const op1 = ethersjsSf.cfaV1.updateFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
        flowRate: oldContributionRate.sub(1).toString(),
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnResp = await txn.wait();
      const txnBlock = await ethers.provider.getBlock(txnResp.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = txnBlock.timestamp - op1Block.timestamp;
      const depletedBuffer = timeSinceDeletion;
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer after flow is deleted and then bidding period elapsed", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        checkAppBalance,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnResp = await txn.wait();
      const txnBlock = await ethers.provider.getBlock(txnResp.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = txnBlock.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);

      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer early if payer bid becomes inactive", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        paymentToken,
        checkAppBalance,
        mockCFABeneficiary,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      // Simulate closing flow
      const op2Resp = await basePCOFacet.manualDeleteFlow(
        mockCFABeneficiary.address
      );
      const op2Receipt = await op2Resp.wait();
      const op2Block = await ethers.provider.getBlock(op2Receipt.blockNumber);

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = op2Block.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer early if payer deletes bid", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        paymentToken,
        checkAppBalance,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const op2Receipt = await txn.wait();
      const op2Block = await ethers.provider.getBlock(op2Receipt.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = op2Block.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer early if payer deletes and reopens bid", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethersjsSf,
        ethx_erc20,
        paymentToken,
        checkAppBalance,
      } = await CFAPenaltyBidFixtures.afterPlaceBid();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      // Payer re-opens flow
      const op2 = ethersjsSf.cfaV1.createFlow({
        receiver: basePCOFacet.address,
        flowRate: oldContributionRate,
        superToken: ethx_erc20.address,
      });

      const op2Resp = await op2.exec(await ethers.getSigner(user));
      const op2Receipt = await op2Resp.wait();
      const op2Block = await ethers.provider.getBlock(op2Receipt.blockNumber);

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = op2Block.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).sub(depletedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer with real license", async () => {
      const {
        basePCOFacet,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBidWithRealLicense();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);

      // Check payment token transfers
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(basePCOFacet.address, user, forSalePrice.add(oldBuffer));
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should refund surplus", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
        surplusBlock,
      } = await CFAPenaltyBidFixtures.afterPlaceBidAndSurplus();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          await basePCOFacet.contributionRate()
        );

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnResp = await txn.wait();
      const txnBlock = await ethers.provider.getBlock(txnResp.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceIncrease = txnBlock.timestamp - surplusBlock.timestamp;
      const accumulatedBuffer = oldContributionRate.mul(timeSinceIncrease);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          user,
          forSalePrice.add(oldBuffer).add(accumulatedBuffer)
        );
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice.sub(forSalePrice)
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer after bidding period elapsed and deposit was depleted during period", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
      } = await CFAPenaltyBidFixtures.afterPlaceBidExtremeFeeDuring();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      await op1.exec(await ethers.getSigner(user));

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(null, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(null, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(0);
      expect(toBidderTransfers.length).to.be.equal(0);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should trigger transfer after bidding period elapsed and deposit was depleted after period", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
      } = await CFAPenaltyBidFixtures.afterPlaceBidExtremeFeeAfter();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const forSalePrice = await basePCOFacet.forSalePrice();

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      await op1.exec(await ethers.getSigner(user));

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 27]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnReceipt = await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(null, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const toBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(null, bidder),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(0);
      expect(toBidderTransfers.length).to.be.equal(0);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.isPayerBidActive()).to.equal(false);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(true);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, BigNumber.from(0));
      await checkAppToBeneficiaryFlow(BigNumber.from(0));
      await checkAppNetFlow();
    });

    it("should trigger transfer and partially refund collateral if collateral was depleted during period", async () => {
      const {
        basePCOFacet,
        mockLicense,
        checkUserToAppFlow,
        checkAppNetFlow,
        checkAppToBeneficiaryFlow,
        ethx_erc20,
        checkAppBalance,
        ethersjsSf,
        paymentToken,
      } = await CFAPenaltyBidFixtures.afterPlaceBidLargeExtremeFeeAfter();

      mockLicense["safeTransferFrom(address,address,uint256)"].reset();

      const { bidder, user } = await getNamedAccounts();

      const oldContributionRate = await basePCOFacet.contributionRate();
      const oldPendingBid = await basePCOFacet.pendingBid();
      const forSalePrice = await basePCOFacet.forSalePrice();
      const oldBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          oldContributionRate
        );

      // Payer deletes flow
      const op1 = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: basePCOFacet.address,
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      const op1Receipt = await op1Resp.wait();
      const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

      // Advance time
      await network.provider.send("evm_increaseTime", [96000]);
      await network.provider.send("evm_mine");

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();
      const txnReceipt = await txn.wait();
      const txnBlock = await ethers.provider.getBlock(txnReceipt.blockNumber);

      await expect(txn)
        .to.emit(basePCOFacet, "TransferTriggered")
        .withArgs(bidder, user, bidder, forSalePrice);
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledOnceWith(
        user,
        bidder,
        await basePCOFacet.licenseId()
      );

      // Check payment token transfers
      const timeSinceDeletion = txnBlock.timestamp - op1Block.timestamp;
      const depletedBuffer = oldContributionRate.mul(timeSinceDeletion);

      const toUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(null, user),
        txnReceipt.blockNumber
      );
      const fromUserTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(user),
        txnReceipt.blockNumber
      );
      const fromBidderTransfers = await ethx_erc20.queryFilter(
        ethx_erc20.filters.Transfer(bidder),
        txnReceipt.blockNumber
      );
      expect(toUserTransfers.length).to.be.equal(0);
      expect(fromUserTransfers.length).to.be.equal(0);
      expect(fromBidderTransfers.length).to.be.equal(0);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(
          basePCOFacet.address,
          bidder,
          oldPendingBid.forSalePrice
            .sub(forSalePrice)
            .sub(depletedBuffer.sub(forSalePrice).sub(oldBuffer))
        );
      await checkAppBalance(0);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.contributionRate).to.equal(0);

      expect(await basePCOFacet.payer()).to.equal(bidder);
      expect(await basePCOFacet.contributionRate()).to.equal(
        oldPendingBid.contributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(
        oldPendingBid.forSalePrice
      );
      expect(await basePCOFacet.isPayerBidActive()).to.equal(true);
      expect(await basePCOFacet.shouldBidPeriodEndEarly()).to.equal(false);
      await checkUserToAppFlow(user, BigNumber.from(0));
      await checkUserToAppFlow(bidder, oldPendingBid.contributionRate);
      await checkAppToBeneficiaryFlow(oldPendingBid.contributionRate);
      await checkAppNetFlow();
    });

    it("should fail if pending bid does not exist", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterAcceptBid();
      const { bidder } = await getNamedAccounts();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Pending bid does not exist"
      );
    });

    it("should fail if bidding period has not elapsed", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();

      const txn = basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .triggerTransfer();

      await expect(txn).to.be.revertedWith(
        "CFAPenaltyBidFacet: Bid period has not elapsed"
      );
    });
  });
});
