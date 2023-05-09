import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments, network } from "hardhat";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { BigNumber } from "ethers";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "./PCOLicenseClaimerV2.fixture";
import { addDays, getUnixTime, startOfToday } from "date-fns";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("PCOLicenseClaimerFacetV2", async function () {
  describe("initialize", async () => {
    it("should initialize", async () => {
      const res = await Fixtures.setup();
      const { pcoLicenseClaimer } = res;

      const mockBeacon = await smock.fake("CFABasePCOFacet");

      await pcoLicenseClaimer.initializeClaimer(
        1,
        10,
        20,
        2,
        mockBeacon.address
      );

      expect(await pcoLicenseClaimer.getAuctionStart()).to.equal(1);
      expect(await pcoLicenseClaimer.getAuctionEnd()).to.equal(10);
      expect(await pcoLicenseClaimer.getStartingBid()).to.equal(20);
      expect(await pcoLicenseClaimer.getEndingBid()).to.equal(2);
    });

    it("should fail if not owner", async () => {
      const res = await Fixtures.setup();
      const { pcoLicenseClaimer } = res;
      const { user } = await getNamedAccounts();

      const mockBeacon = await smock.fake("IDiamondReadable");

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .initializeClaimer(1, 10, 20, 2, mockBeacon.address);

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
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

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
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

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
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

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
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

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
    });
  });

  describe("setBeacon", async () => {
    it("should set", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      await pcoLicenseClaimer.setBeacon(user);

      expect(await pcoLicenseClaimer.getBeacon()).to.equal(user);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseClaimer } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .setBeacon(user);

      await expect(txn).to.be.revertedWith("Ownable: sender must be owner");
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
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      let requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      let approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      const newBeaconProxy = await pcoLicenseClaimer.getBeaconProxy(0);

      expect(newBeaconProxy).to.equal(
        nextAddress,
        "First next address is not correct"
      );

      const nextAddress2 = await pcoLicenseClaimer.getNextProxyAddress(user);

      // Approve payment token for buffer
      requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const coord1 = BigNumber.from(5).shl(32).or(BigNumber.from(33));
      await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord1,
            lngDim: 1,
            latDim: 1,
          }
        );

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
      await network.provider.send("evm_mine", [daysFromNow]);

      let prevPrice = await pcoLicenseClaimer.requiredBid();
      expect(prevPrice.lt(startPrice)).to.be.true;

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await network.provider.send("evm_mine", [daysFromNow]);
      let nextPrice = await pcoLicenseClaimer.requiredBid();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();
      expect(nextPrice.lt(prevPrice)).to.be.true;

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();

      expect(nextPrice.lt(prevPrice)).to.be.true;
      expect(nextPrice).to.be.equal(endingBid);

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 12));
      await network.provider.send("evm_mine", [daysFromNow]);
      nextPrice = await pcoLicenseClaimer.requiredBid();

      expect(nextPrice).to.be.equal(endingBid);
    });
  });

  describe("claim", async () => {
    it("should claim", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await txn.wait();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
    });

    it("should claim when payment is required", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        paymentToken,
        ethersjsSf,
        ethx_erc20,
      } = await Fixtures.initializedWithAuction();
      const { user, diamondAdmin } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      // Approve payment token
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: forSalePrice.add(requiredBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );
      await txn.wait();

      const requiredBid = await pcoLicenseClaimer.requiredBid();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, diamondAdmin, requiredBid);
    });

    it("should claim with real BeaconDiamond", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
      } = await Fixtures.setup();

      const { diamondAdmin } = await getNamedAccounts();
      const { diamond } = deployments;
      await diamond.deploy("TestBasePCO", {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
      });

      const beacon = await ethers.getContract("TestBasePCO", diamondAdmin);

      await pcoLicenseClaimer.initializeClaimer(0, 0, 0, 0, beacon.address);

      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow creation
      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);
      const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: nextAddress,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op2.exec(await ethers.getSigner(user));

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await txn.wait();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
    });

    it("should fail if payment fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if payment for buffer fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        paymentToken,
      } = await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      const requiredBid = await pcoLicenseClaimer.requiredBid();

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBid.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if buildAndMint fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      const approveOp1 = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp1.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await expect(txn).to.be.revertedWith(
        "LibGeoWebParcel: Coordinate is not available"
      );
    });

    it("should fail if forSalePrice does not meet requirement", async () => {
      const { pcoLicenseClaimerV2, pcoLicenseParams } =
        await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = BigNumber.from(1);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256))"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          }
        );

      await expect(txn).to.be.revertedWith(
        "PCOLicenseClaimerFacetV2: Initial for sale price does not meet requirement"
      );
    });
  });

  describe("claim with content hash", async () => {
    it("should claim", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await txn.wait();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
    });

    it("should claim when payment is required", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        paymentToken,
        ethersjsSf,
        ethx_erc20,
      } = await Fixtures.initializedWithAuction();
      const { user, diamondAdmin } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      // Approve payment token
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: forSalePrice.add(requiredBuffer).toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );
      await txn.wait();

      const requiredBid = await pcoLicenseClaimer.requiredBid();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, diamondAdmin, requiredBid);
    });

    it("should claim with real BeaconDiamond", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
        ethx_erc20,
      } = await Fixtures.setup();

      const { diamondAdmin } = await getNamedAccounts();
      const { diamond } = deployments;
      await diamond.deploy("TestBasePCO", {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
      });

      const beacon = await ethers.getContract("TestBasePCO", diamondAdmin);

      await pcoLicenseClaimer.initializeClaimer(0, 0, 0, 0, beacon.address);

      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      // Approve flow creation
      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);
      const op2 = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
        superToken: paymentToken.address,
        flowOperator: nextAddress,
        permissions: 1,
        flowRateAllowance: contributionRate.toString(),
      });
      await op2.exec(await ethers.getSigner(user));

      const txn = await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await txn.wait();

      await expect(txn)
        .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
        .withArgs(0, user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user, nextAddress, requiredBuffer);
    });

    it("should fail if payment fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if payment for buffer fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        paymentToken,
      } = await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await network.provider.send("evm_mine", [daysFromNow]);

      const requiredBid = await pcoLicenseClaimer.requiredBid();

      // Approve payment token
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBid.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });

    it("should fail if buildAndMint fails", async () => {
      const {
        pcoLicenseClaimer,
        pcoLicenseClaimerV2,
        pcoLicenseParams,
        ethersjsSf,
        paymentToken,
      } = await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = ethers.utils
        .parseEther("9")
        .div(365 * 24 * 60 * 60 * 10);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      // Approve payment token for buffer
      const requiredBuffer = await ethersjsSf.cfaV1.contract
        .connect(await ethers.getSigner(user))
        .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
      const approveOp = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp.exec(await ethers.getSigner(user));

      await pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      const approveOp1 = paymentToken.approve({
        receiver: pcoLicenseClaimer.address,
        amount: requiredBuffer.toString(),
      });
      await approveOp1.exec(await ethers.getSigner(user));

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await expect(txn).to.be.revertedWith(
        "LibGeoWebParcel: Coordinate is not available"
      );
    });

    it("should fail if forSalePrice does not meet requirement", async () => {
      const { pcoLicenseClaimerV2, pcoLicenseParams } =
        await Fixtures.initializedWithAuction();
      const { user } = await getNamedAccounts();

      const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = BigNumber.from(1);
      const forSalePrice = await rateToPurchasePrice(
        pcoLicenseParams,
        contributionRate
      );

      const txn = pcoLicenseClaimerV2
        .connect(await ethers.getSigner(user))
        ["claim(int96,uint256,(uint64,uint256,uint256),bytes)"](
          contributionRate,
          forSalePrice,
          {
            swCoordinate: coord,
            lngDim: 1,
            latDim: 1,
          },
          "0x11"
        );

      await expect(txn).to.be.revertedWith(
        "PCOLicenseClaimerFacetV2: Initial for sale price does not meet requirement"
      );
    });
  });
});
