import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3, network } from "hardhat";
import { Framework, SFError, SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, Contract, ContractReceipt } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { solidity } from "ethereum-waffle";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { deployments, getNamedAccounts } from "hardhat";
import { ISuperfluid } from "../../typechain-types/ISuperfluid";
import { toUtf8Bytes } from "@ethersproject/strings";
import { BasePCOFacet } from "../../typechain-types/BasePCOFacet";
import {
  perYearToPerSecondRate,
  errorHandler,
  rateToPurchasePrice,
} from "../shared";
import Fixtures from "./BasePCO.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("BasePCOFacet", async function () {
  this.timeout(0);

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
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
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
        user,
        contributionRate,
        forSalePrice
      );
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "PayerBidUpdated")
        .withArgs(user, contributionRate, forSalePrice);
      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(contributionRate);
      expect(await basePCOFacet.forSalePrice()).to.equal(forSalePrice);
      expect(await basePCOFacet.isBidActive()).to.equal(true);
    });

    it("should fail if not contract owner", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
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
          user,
          contributionRate,
          forSalePrice
        );
      await expect(txn).to.be.revertedWith(
        "LibDiamond: Must be contract owner"
      );
    });

    it("should fail if buffer is missing", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
        await Fixtures.setup();
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
        user,
        contributionRate,
        forSalePrice
      );
      await expect(txn).to.be.revertedWith("CFA: not enough available balance");
    });

    it("should fail if flow permissions are missing", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
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
        user,
        contributionRate,
        forSalePrice
      );
      await expect(txn).to.be.revertedWith("CFA: E_NO_OPERATOR_CREATE_FLOW");
    });

    it("should fail if for sale price is incorrect rounding", async () => {
      const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } =
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
        user,
        contributionRate.add(10),
        forSalePrice
      );
      await expect(txn).to.be.revertedWith(
        "BasePCOFacet: Incorrect for sale price"
      );
    });
  });

  describe("editBid", async () => {
    it("should edit bid", async () => {
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

      const txn = await basePCOFacet
        .connect(await ethers.getSigner(user))
        .editBid(newContributionRate, newForSalePrice);
      await txn.wait();

      await expect(txn)
        .to.emit(basePCOFacet, "PayerBidUpdated")
        .withArgs(user, newContributionRate, newForSalePrice);
      expect(await basePCOFacet.payer()).to.equal(user);
      expect(await basePCOFacet.contributionRate()).to.equal(
        newContributionRate
      );
      expect(await basePCOFacet.forSalePrice()).to.equal(newForSalePrice);
      expect(await basePCOFacet.isBidActive()).to.equal(true);
    });
  });
});
