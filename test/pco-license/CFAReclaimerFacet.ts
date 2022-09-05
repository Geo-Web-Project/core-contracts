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

describe("CFAReclaimerFaceit", async function () {
  describe("claim", async () => {
      it("emits the licenseReclaimed event", async () => {
        const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } = await BaseFixtures.afterPayerDelete();
        const { bidder } = await getNamedAccounts();

        const contributionRate = BigNumber.from(100);
        const forSalePrice = await rateToPurchasePrice(
          mockParamsStore,
          contributionRate
        );
        const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          contributionRate
        );
        const totalCollateral = forSalePrice.add(requiredBuffer);

        // Transfer payment token for buffer
        const claimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .claimPrice();

        const op1 = paymentToken.transfer({
          receiver: bidder,
          amount: claimPrice.add(totalCollateral).toString(),
        });
        await op1.exec(await ethers.getSigner(bidder));

        // Allow spending of claimPrice
        const op2 = paymentToken.approve({amount: claimPrice.add(totalCollateral), receiver: basePCOFacet.address});
        await op2.exec(await ethers.getSigner(bidder));

        // Approve flow creation
        const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
          superToken: paymentToken.address,
          flowOperator: basePCOFacet.address,
          permissions: 1,
          flowRateAllowance: contributionRate.toString(),
        });
        await op3.exec(await ethers.getSigner(bidder));

        const txn = await basePCOFacet.connect(await ethers.getSigner(bidder)).claim(contributionRate, forSalePrice);
        await txn.wait();
        await expect(txn).to.emit(basePCOFacet, "LicenseReclaimed");
      });

      it("calls license.safeTransferFrom", async () => {
        const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf, mockLicense } = await BaseFixtures.afterPayerDelete();
        const { bidder, user } = await getNamedAccounts();

        const contributionRate = BigNumber.from(100);
        const forSalePrice = await rateToPurchasePrice(
          mockParamsStore,
          contributionRate
        );
        const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          contributionRate
        );
        const totalCollateral = forSalePrice.add(requiredBuffer);

        // Transfer payment token for buffer
        const claimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .claimPrice();

        const op1 = paymentToken.transfer({
          receiver: bidder,
          amount: claimPrice.add(totalCollateral).toString(),
        });
        await op1.exec(await ethers.getSigner(bidder));

        // Allow spending of claimPrice
        const op2 = paymentToken.approve({amount: claimPrice.add(totalCollateral), receiver: basePCOFacet.address});
        await op2.exec(await ethers.getSigner(bidder));

        // Approve flow creation
        const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
          superToken: paymentToken.address,
          flowOperator: basePCOFacet.address,
          permissions: 1,
          flowRateAllowance: contributionRate.toString(),
        });
        await op3.exec(await ethers.getSigner(bidder));

        const txn = await basePCOFacet.connect(await ethers.getSigner(bidder)).claim(contributionRate, forSalePrice);
        await txn.wait();
        expect(
          mockLicense["safeTransferFrom(address,address,uint256)"]
        ).to.have.been.calledWith(
          user,
          bidder,
          await basePCOFacet.licenseId()
        );
      });

      it("should revert if the player bid is active", async () => {
        const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } = await BaseFixtures.initialized();
        const { bidder } = await getNamedAccounts();

        const contributionRate = BigNumber.from(100);
        const forSalePrice = await rateToPurchasePrice(
          mockParamsStore,
          contributionRate
        );
        const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          contributionRate
        );
        const totalCollateral = forSalePrice.add(requiredBuffer);

        // Transfer payment token for buffer

        const op1 = paymentToken.transfer({
          receiver: bidder,
          amount: totalCollateral.toString(),
        });
        await op1.exec(await ethers.getSigner(bidder));

        // Allow spending of claimPrice
        const op2 = paymentToken.approve({amount: totalCollateral.toString(), receiver: basePCOFacet.address});
        await op2.exec(await ethers.getSigner(bidder));

        // Approve flow creation
        const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
          superToken: paymentToken.address,
          flowOperator: basePCOFacet.address,
          permissions: 1,
          flowRateAllowance: contributionRate.toString(),
        });
        await op3.exec(await ethers.getSigner(bidder));

        await expect(basePCOFacet.connect(await ethers.getSigner(bidder)).claim(contributionRate, forSalePrice)).to.be.revertedWith("CFAReclaimerFacet: Can only perform action when payer bid is active");
      });

      it("should revert if the sale price is incorrect", async () => {
        const { basePCOFacet, mockParamsStore, paymentToken, ethersjsSf } = await BaseFixtures.afterPayerDelete();
        const { bidder } = await getNamedAccounts();

        const contributionRate = BigNumber.from(100);
        const forSalePrice = (await rateToPurchasePrice(
          mockParamsStore,
          contributionRate
        )).sub(100);
        const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(bidder))
        .getDepositRequiredForFlowRate(
          paymentToken.address,
          contributionRate
        );
        const totalCollateral = forSalePrice.add(requiredBuffer);

        // Transfer payment token for buffer
        const claimPrice = await basePCOFacet
        .connect(await ethers.getSigner(bidder))
        .claimPrice();

        const op1 = paymentToken.transfer({
          receiver: bidder,
          amount: claimPrice.add(totalCollateral).toString(),
        });
        await op1.exec(await ethers.getSigner(bidder));

        // Allow spending of claimPrice
        const op2 = paymentToken.approve({amount: claimPrice.add(totalCollateral), receiver: basePCOFacet.address});
        await op2.exec(await ethers.getSigner(bidder));

        // Approve flow creation
        const op3 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
          superToken: paymentToken.address,
          flowOperator: basePCOFacet.address,
          permissions: 1,
          flowRateAllowance: contributionRate.toString(),
        });
        await op3.exec(await ethers.getSigner(bidder));

        await expect(basePCOFacet.connect(await ethers.getSigner(bidder)).claim(contributionRate, forSalePrice)).to.be.revertedWith("CFAReclaimerFacet: Incorrect for sale price");
      });
  });

  describe("claimPrice", async () => {
    let originalForSalePrice: BigNumber;
    let prevPrice: BigNumber;
    let nextPrice: BigNumber;
    let daysFromNow: number;

    it("should decay the price until the auctionLength expires", async () => {
      const { basePCOFacet } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      const currentBid = await basePCOFacet.currentBid()
      originalForSalePrice = currentBid.forSalePrice;

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await network.provider.send("evm_mine", [daysFromNow]);

      const startPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(startPrice.lt(originalForSalePrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await network.provider.send("evm_mine", [daysFromNow]);

      prevPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 13));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;
    });

    it("should return a price of 0 if auctionLength has expired", async () => {
      const { basePCOFacet } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      daysFromNow = getUnixTime(addDays(startOfToday(), 15));
      await network.provider.send("evm_mine", [daysFromNow]);
      const price = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(price.eq(ethers.constants.Zero)).to.be.true;
    });

    it("should revert if the player bid is active", async () => {
      const { basePCOFacet } = await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      await expect(basePCOFacet.connect(await ethers.getSigner(user)).claimPrice()).to.be.revertedWith(
        "CFAReclaimerFacet: Can only perform action when payer bid is active"
      );
    });
  });
});
