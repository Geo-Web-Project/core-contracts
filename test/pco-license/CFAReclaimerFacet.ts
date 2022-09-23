import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, getNamedAccounts, network } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { addDays, getUnixTime, startOfToday } from "date-fns";
import BaseFixtures from "./CFABasePCO.fixture";
import { rateToPurchasePrice } from "../shared";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("CFAReclaimerFacet", async function () {
  describe("reclaim", async () => {
    it("should emits the licenseReclaimed event and calls license.safeTransferFrom", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        paymentToken,
        ethersjsSf,
        mockLicense,
      } = await BaseFixtures.afterPayerDelete();
      const { bidder, user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const totalCollateral = forSalePrice.add(requiredBuffer);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(totalCollateral),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaim(contributionRate, forSalePrice);
      await txn.wait();
      await expect(txn).to.emit(basePCOFacet, "LicenseReclaimed");
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(user, bidder, await basePCOFacet.licenseId());
    });

    it("should succeed if for sale price is higher than claim price", async () => {
      const {
        basePCOFacet,
        mockParamsStore,
        paymentToken,
        ethersjsSf,
        mockLicense,
      } = await BaseFixtures.afterPayerDelete();
      const { bidder, user } = await getNamedAccounts();

      const contributionRate = BigNumber.from(200);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(requiredBuffer),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaim(contributionRate, forSalePrice);
      await txn.wait();
      await expect(txn).to.emit(basePCOFacet, "LicenseReclaimed");
      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(user, bidder, await basePCOFacet.licenseId());
    });

    it("should revert if insufficient balance", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.afterPayerDelete();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(requiredBuffer),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      // remove all payment tokens
      const op4 = paymentToken.transfer({
        amount: await paymentToken.balanceOf({
          account: bidder,
          providerOrSigner: await ethers.getSigner(bidder),
        }),
        receiver: basePCOFacet.address,
      });
      await op4.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith("SuperfluidToken: move amount exceeds balance");
    });

    it("should revert if insufficient allowance", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.afterPayerDelete();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice,
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith("SuperToken: transfer amount exceeds allowance");
    });

    it("should revert if permission not granted to create flow", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.afterPayerDelete();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(requiredBuffer),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith(
        "CFAReclaimerFacet: CREATE_FLOW permission not granted"
      );
    });

    it("should revert if flow permission doesn't have enough allowance", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.afterPayerDelete();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(requiredBuffer),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.sub(1).toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith(
        "CFAReclaimerFacet: CREATE_FLOW permission does not have enough allowance"
      );
    });

    it("should revert if the payer bid is active", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.initialized();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: requiredBuffer.toString(),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith(
        "CFAReclaimerFacet: Can only perform action when payer bid is active"
      );
    });

    it("should revert if the sale price is incorrect", async () => {
      const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } =
        await BaseFixtures.afterPayerDelete();
      const { bidder } = await getNamedAccounts();

      const contributionRate = BigNumber.from(100);
      const forSalePrice = (
        await rateToPurchasePrice(mockParamsStore, contributionRate)
      ).sub(100);
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);

      const reclaimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .reclaimPrice();

      // Allow spending of reclaimPrice
      const op2 = paymentToken.approve({
        amount: reclaimPrice.add(requiredBuffer),
        receiver: basePCOFacet.address,
      });
      await op2.exec(await ethers.getSigner(bidder));

      // Approve flow creation
      const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: basePCOFacet.address,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op3.exec(await ethers.getSigner(bidder));

      await expect(
        basePCOFacet
          .connect(await ethers.getSigner(bidder))
          .reclaim(contributionRate, forSalePrice)
      ).to.be.revertedWith("CFAReclaimerFacet: Incorrect for sale price");
    });
  });

  describe("reclaimPrice", async () => {
    let originalForSalePrice: BigNumber;
    let prevPrice: BigNumber;
    let nextPrice: BigNumber;
    let daysFromNow: number;

    it("should decay the price until the auctionLength expires", async () => {
      const { basePCOFacet } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      const currentBid = await basePCOFacet.currentBid();
      originalForSalePrice = currentBid.forSalePrice;

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await network.provider.send("evm_mine", [daysFromNow]);

      const startPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(startPrice.lt(originalForSalePrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await network.provider.send("evm_mine", [daysFromNow]);

      prevPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 13));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;
    });

    it("should decay the price even if account is updated during", async () => {
      const { basePCOFacet, ethersjsSf, ethx_erc20 } =
        await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      const currentBid = await basePCOFacet.currentBid();
      originalForSalePrice = currentBid.forSalePrice;

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await network.provider.send("evm_mine", [daysFromNow]);

      const startPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(startPrice.lt(originalForSalePrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await network.provider.send("evm_mine", [daysFromNow]);

      prevPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      // Update account
      const op2 = ethersjsSf.cfaV1.createFlow({
        receiver: basePCOFacet.address,
        flowRate: "100",
        superToken: ethx_erc20.address,
      });

      const op2Resp = await op2.exec(await ethers.getSigner(user));
      await op2Resp.wait();

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 13));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;
    });

    it("should return a price of 0 if auctionLength has expired", async () => {
      const { basePCOFacet } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      daysFromNow = getUnixTime(addDays(startOfToday(), 15));
      await network.provider.send("evm_mine", [daysFromNow]);
      const price = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .reclaimPrice();
      expect(price.eq(ethers.constants.Zero)).to.be.true;
    });

    it("should revert if the payer bid is active", async () => {
      const { basePCOFacet } = await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      await expect(
        basePCOFacet.connect(await ethers.getSigner(user)).reclaimPrice()
      ).to.be.revertedWith(
        "CFAReclaimerFacet: Can only perform action when payer bid is active"
      );
    });
  });
});
