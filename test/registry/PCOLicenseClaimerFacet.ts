import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { BigNumber } from "ethers";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "./PCOLicenseClaimer.fixture";
import { getUpgradeableBeaconFactory } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { addDays, endOfToday, getUnixTime, startOfToday } from "date-fns";

const hre = require("hardhat");

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("PCOLicenseClaimerFacet", async function () {
  describe("initialized", async () => {
    it("should initialize", async () => {
      const res = await Fixtures.setup();
      const { pcoLicenseClaimer } = res;

      const mockBeacon = await smock.fake("CFABasePCOFacet");

      const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
      const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

      await pcoLicenseClaimer.initialize(1, 10, 20, 2, beacon.address);

      expect(await pcoLicenseClaimer.getAuctionStart()).to.equal(1);
      expect(await pcoLicenseClaimer.getAuctionEnd()).to.equal(10);
      expect(await pcoLicenseClaimer.getStartingBid()).to.equal(20);
      expect(await pcoLicenseClaimer.getEndingBid()).to.equal(2);
    });

    it("should fail if not owner", async () => {
      const res = await Fixtures.setup();
      const { pcoLicenseClaimer } = res;
      const { user } = await getNamedAccounts();

      const mockBeacon = await smock.fake("CFABasePCOFacet");

      const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
      const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .initialize(1, 10, 20, 2, beacon.address);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setAuctionStart", async () => {
    it("should set", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();

      await pcoLicenseClaimer.setAuctionStart(1);

      expect(await pcoLicenseClaimer.getAuctionStart()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .setAuctionStart(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setAuctionEnd", async () => {
    it("should set", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();

      await pcoLicenseClaimer.setAuctionEnd(1);

      expect(await pcoLicenseClaimer.getAuctionEnd()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .setAuctionEnd(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setStartingBid", async () => {
    it("should set", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();

      await pcoLicenseClaimer.setStartingBid(1);

      expect(await pcoLicenseClaimer.getStartingBid()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .setStartingBid(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setEndingBid", async () => {
    it("should set", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();

      await pcoLicenseClaimer.setEndingBid(1);

      expect(await pcoLicenseClaimer.getEndingBid()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .setEndingBid(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("getNextAddress", async () => {
    it("should calculate different address per user", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user, bidder } = await getNamedAccounts();

      const nextAddress1 = await pcoLicenseClaimer.getNextProxyAddress(user);
      const nextAddress2 = await pcoLicenseClaimer.getNextProxyAddress(bidder);

      expect(nextAddress1).to.not.equal(nextAddress2);
    });

    it("should calculate next address", async () => {
      const { pcoLicenseClaimer, mockParamsStore } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils.parseEther("1");
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      await pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .claim(contributionRate, forSalePrice, coord, [BigNumber.from(0)]);

      const newBeaconProxy = await pcoLicenseClaimer.getBeaconProxy(0);

      expect(newBeaconProxy).to.equal(
        nextAddress,
        "First next address is not correct"
      );

      const nextAddress2 = await pcoLicenseClaimer.getNextProxyAddress(user);

      let coord1 = BigNumber.from(5).shl(32).or(BigNumber.from(33));
      await pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .claim(contributionRate, forSalePrice, coord1, [BigNumber.from(0)]);

      const newBeaconProxy1 = await pcoLicenseClaimer.getBeaconProxy(1);
      expect(newBeaconProxy1).to.equal(
        nextAddress2,
        "Second next address is not correct"
      );
    });
  });

  describe("requiredBid", async () => {
    it("should decay the price until the auction ends", async () => {
      const { pcoLicenseClaimer, startBid, endingBid } =
        await Fixtures.initializedWithAuction();

      const startPrice = await pcoLicenseClaimer.requiredBid();

      expect(startPrice.lt(startBid)).to.be.true;

      let daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await hre.network.provider.send("evm_mine", [daysFromNow]);

      let prevPrice = await pcoLicenseClaimer.requiredBid();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await hre.network.provider.send("evm_mine", [daysFromNow]);
      let nextPrice = await pcoLicenseClaimer.requiredBid();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await hre.network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await hre.network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();

      expect(nextPrice.lt(prevPrice)).to.be.true;
      expect(nextPrice).to.be.equal(endingBid);

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 12));
      await hre.network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();

      expect(nextPrice).to.be.equal(endingBid);
    });
  });
});
