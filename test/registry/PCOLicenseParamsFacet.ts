import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { PCOLicenseParamsFacet } from "../../typechain-types";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("PCOLicenseParamsFacet", async function () {
  const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options) => {
      await deployments.fixture();
      const { diamondAdmin } = await getNamedAccounts();
      const { diamond } = deployments;
      await diamond.deploy("PCOLicenseParamsFacet", {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ["PCOLicenseParamsFacet"],
      });

      const pcoLicenseParams: PCOLicenseParamsFacet = await ethers.getContract(
        "PCOLicenseParamsFacet",
        diamondAdmin
      );

      return {
        pcoLicenseParams,
      };
    }
  );

  describe("initialized", async () => {
    it("should initialize", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user, bidder, diamondAdmin } = await getNamedAccounts();

      await pcoLicenseParams.initializeParams(
        diamondAdmin,
        user,
        bidder,
        1,
        2,
        3,
        4,
        5,
        6
      );

      expect(await pcoLicenseParams.getBeneficiary()).to.equal(diamondAdmin);
      expect(await pcoLicenseParams.getPaymentToken()).to.equal(user);
      expect(await pcoLicenseParams.getHost()).to.equal(bidder);
      expect(await pcoLicenseParams.getPerSecondFeeNumerator()).to.equal(1);
      expect(await pcoLicenseParams.getPerSecondFeeDenominator()).to.equal(2);
      expect(await pcoLicenseParams.getPenaltyNumerator()).to.equal(3);
      expect(await pcoLicenseParams.getPenaltyDenominator()).to.equal(4);
      expect(await pcoLicenseParams.getBidPeriodLengthInSeconds()).to.equal(5);
      expect(await pcoLicenseParams.getReclaimAuctionLength()).to.equal(6);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user, bidder, diamondAdmin } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .initializeParams(diamondAdmin, user, bidder, 1, 2, 3, 4, 5, 6);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setBeneficiary", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      await pcoLicenseParams.setBeneficiary(user);

      expect(await pcoLicenseParams.getBeneficiary()).to.equal(user);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setBeneficiary(user);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setPaymentToken", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      await pcoLicenseParams.setPaymentToken(user);

      expect(await pcoLicenseParams.getPaymentToken()).to.equal(user);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setPaymentToken(user);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setHost", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      await pcoLicenseParams.setHost(user);

      expect(await pcoLicenseParams.getHost()).to.equal(user);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setHost(user);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setPerSecondFeeNumerator", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setPerSecondFeeNumerator(1);

      expect(await pcoLicenseParams.getPerSecondFeeNumerator()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setPerSecondFeeNumerator(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setPerSecondFeeDenominator", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setPerSecondFeeDenominator(1);

      expect(await pcoLicenseParams.getPerSecondFeeDenominator()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setPerSecondFeeDenominator(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setPenaltyNumerator", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setPenaltyNumerator(1);

      expect(await pcoLicenseParams.getPenaltyNumerator()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setPenaltyNumerator(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setPenaltyDenominator", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setPenaltyDenominator(1);

      expect(await pcoLicenseParams.getPenaltyDenominator()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setPenaltyDenominator(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setBidPeriodLengthInSeconds", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setBidPeriodLengthInSeconds(1);

      expect(await pcoLicenseParams.getBidPeriodLengthInSeconds()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setBidPeriodLengthInSeconds(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });

  describe("setReclaimAuctionLength", async () => {
    it("should set", async () => {
      const { pcoLicenseParams } = await setupTest();

      await pcoLicenseParams.setReclaimAuctionLength(1);

      expect(await pcoLicenseParams.getReclaimAuctionLength()).to.equal(1);
    });

    it("should fail if not owner", async () => {
      const { pcoLicenseParams } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = pcoLicenseParams
        .connect(await ethers.getSigner(user))
        .setReclaimAuctionLength(1);

      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });
  });
});
