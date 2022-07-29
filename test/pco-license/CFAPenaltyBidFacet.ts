import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, getUnnamedAccounts } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { getNamedAccounts } from "hardhat";
import { rateToPurchasePrice } from "../shared";
import BaseFixtures from "./CFABasePCO.fixture";
import CFAPenaltyBidFixtures from "./CFAPenaltyBid.fixture";

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
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
      const op = await ethersjsSf.cfaV1.revokeFlowOperatorWithFullControl({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
      });
      await op.exec(await ethers.getSigner(bidder));

      expect(await basePCOFacet.hasPendingBid()).to.equal(true);
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
      } = await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
        .withArgs(bidder, basePCOFacet.address, newForSalePrice);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.bidder).to.equal(bidder);
      expect(pendingBid.contributionRate).to.equal(newContributionRate);
      expect(pendingBid.forSalePrice).to.equal(newForSalePrice);
    });

    it("should place bid with full control", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = await ethersjsSf.cfaV1.authorizeFlowOperatorWithFullControl({
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

      const pendingBid = await basePCOFacet.pendingBid();
      expect(pendingBid.bidder).to.equal(bidder);
      expect(pendingBid.contributionRate).to.equal(newContributionRate);
      expect(pendingBid.forSalePrice).to.equal(newForSalePrice);
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
      const { basePCOFacet, mockParamsStore, paymentToken } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
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

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
      });
      await approveOp.exec(await ethers.getSigner(bidder));

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve payment token
      const approveOp = await paymentToken.approve({
        receiver: basePCOFacet.address,
        amount: newForSalePrice.toString(),
      });
      await approveOp.exec(await ethers.getSigner(accounts[3]));

      // Approve flow update
      const op1 = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
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
  });
});
