import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, getNamedAccounts, network } from "hardhat";
import { BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { addDays, getUnixTime, startOfToday } from "date-fns";
import { rateToPurchasePrice } from "../shared";
import BaseFixtures from "./CFABasePCO.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("CFAReclaimerFaceit", async function () {
  /*
  describe("#claim", async () => {
    beforeEach(async () => {
      await setupAuction();

      // licenseId of 1
      claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);

      userArg = await user.getAddress();
      initialContributionRate = BigNumber.from(9);

      fakeLicense.ownerOf.returns(fakeAddress);
    });

    it("requires the CLAIMER role", async () => {
      await expect(
        reclaimer
          .connect(user)
          .claim(userArg, initialContributionRate, claimData)
      ).to.be.rejectedWith(/AccessControl/);

      const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
      await reclaimer
        .connect(admin)
        .grantRole(RECLAIM_ROLE, await user.getAddress());
      await expect(
        reclaimer
          .connect(user)
          .claim(userArg, initialContributionRate, claimData)
      ).to.be.fulfilled;
      expect(
        fakeLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(fakeAddress, userArg, 1);
    });

    it("reverts if user is the 0x0 address", async () => {
      const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
      await reclaimer
        .connect(admin)
        .grantRole(RECLAIM_ROLE, await user.getAddress());
      fakeLicense.ownerOf.returns(ethers.constants.AddressZero);

      await expect(
        reclaimer
          .connect(user)
          .claim(userArg, initialContributionRate, claimData)
      ).to.be.revertedWith("Reclaimer: Cannot reclaim non-existent license");
    });

    describe("success", async () => {
      beforeEach(async () => {
        const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
        await reclaimer
          .connect(admin)
          .grantRole(RECLAIM_ROLE, await user.getAddress());
        licenseId = 1;
      });

      it("emits the licenseId", async () => {
        const tx = await reclaimer
          .connect(user)
          .claim(userArg, initialContributionRate, claimData);
        const receipt = await tx.wait();
        const retVal = receipt.events![0].topics[1];
        expect(Number(retVal)).to.be.equal(licenseId);
      });

      it("calls license.safeTransferFrom", async () => {
        await reclaimer
          .connect(user)
          .claim(userArg, initialContributionRate, claimData);
        expect(
          fakeLicense["safeTransferFrom(address,address,uint256)"]
        ).to.have.been.calledWith(fakeAddress, userArg, licenseId);
      });
    });
  });
  */

  describe("claimPrice", async () => {
    let originalForSalePrice: BigNumber;
    let prevPrice: BigNumber;
    let nextPrice: BigNumber;
    let daysFromNow: number;

    it("should decay the price until the auctionLength expires", async () => {
      const { basePCOFacet } = await BaseFixtures.afterPayerDelete();
      const { user } = await getNamedAccounts();

      originalForSalePrice = await basePCOFacet.forSalePrice();

      const startPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(startPrice.lt(originalForSalePrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await network.provider.send("evm_mine", [daysFromNow]);

      prevPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .claimPrice();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
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

    it("should revert if the reclaimer auction hasn't started", async () => {
      const { basePCOFacet } = await BaseFixtures.initialized();
      const { user } = await getNamedAccounts();

      await expect(basePCOFacet.connect(await ethers.getSigner(user)).claimPrice()).to.be.revertedWith(
        "CFAReclaimerFacet: The reclaim auction hasn't started yet"
      );
    });
  });
});
