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

  describe("isPendingBidValid", async () => {
    it("should be invalid after initialization", async () => {
      const { basePCOFacet } = await BaseFixtures.initialized();

      expect(await basePCOFacet.isPendingBidValid()).to.equal(false);
    });

    it("should be valid after place bid", async () => {
      const { basePCOFacet } = await CFAPenaltyBidFixtures.afterPlaceBid();

      expect(await basePCOFacet.isPendingBidValid()).to.equal(true);
    });

    it("should be invalid after decreasing flow allowance", async () => {
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

      expect(await basePCOFacet.isPendingBidValid()).to.equal(false);
    });

    it("should be invalid after revoking full control", async () => {
      const { basePCOFacet, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();

      // Revoke permissions
      const op = await ethersjsSf.cfaV1.revokeFlowOperatorWithFullControl({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
      });
      await op.exec(await ethers.getSigner(bidder));

      expect(await basePCOFacet.isPendingBidValid()).to.equal(false);
    });
  });

  describe("placeBid", async () => {
    it("should place bid with create permissions", async () => {
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

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .placeBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidPlaced")
        .withArgs(bidder, newContributionRate, newForSalePrice);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(await basePCOFacet.isPendingBidValid()).to.equal(true);
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
      expect(await basePCOFacet.isPendingBidValid()).to.equal(true);
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
      const { basePCOFacet, mockParamsStore } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

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

    it("should place bid if previous bid was invalidated", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await CFAPenaltyBidFixtures.afterPlaceBid();
      const { bidder } = await getNamedAccounts();
      const accounts = await getUnnamedAccounts();

      // Revoke permissions
      const op = await ethersjsSf.cfaV1.revokeFlowOperatorWithFullControl({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
      });
      await op.exec(await ethers.getSigner(bidder));

      const newContributionRate = BigNumber.from(200);
      const newForSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        newContributionRate
      );

      // Approve flow update
      const op1 = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: newContributionRate.toString(),
      });
      await op1.exec(await ethers.getSigner(accounts[3]));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(accounts[3]))
        .placeBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "BidPlaced")
        .withArgs(accounts[3], newContributionRate, newForSalePrice);

      const pendingBid = await basePCOFacet.pendingBid();
      expect(await basePCOFacet.isPendingBidValid()).to.equal(true);
      expect(pendingBid.bidder).to.equal(accounts[3]);
      expect(pendingBid.contributionRate).to.equal(newContributionRate);
      expect(pendingBid.forSalePrice).to.equal(newForSalePrice);
    });
  });
});
