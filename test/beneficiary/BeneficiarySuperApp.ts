import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments, network } from "hardhat";
import { ContractReceipt } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { setupSf, perYearToPerSecondRate } from "../shared";
import { BigNumber } from "ethers";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("BeneficiarySuperApp", async function () {
  const setupTest = deployments.createFixture(
    async ({ getNamedAccounts, ethers }) => {
      const res = await setupSf();
      const { hostContract, sf, paymentToken, ethersjsSf } = res;
      const { diamondAdmin } = await getNamedAccounts();

      const { numerator, denominator } = perYearToPerSecondRate(0.1);

      const mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
      mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
      mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
      mockParamsStore.getPenaltyNumerator.returns(numerator);
      mockParamsStore.getPenaltyDenominator.returns(denominator);
      mockParamsStore.getHost.returns(sf.host.address);
      mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
      mockParamsStore.getBeneficiary.returns(diamondAdmin);
      mockParamsStore.getBidPeriodLengthInSeconds.returns(60 * 60 * 24);
      mockParamsStore.getReclaimAuctionLength.returns(14 * 60 * 60 * 24);

      const BeneficiarySuperApp = await ethers.getContractFactory(
        "BeneficiarySuperApp"
      );
      const beneSuperApp = await BeneficiarySuperApp.deploy(
        mockParamsStore.address,
        diamondAdmin
      );
      await beneSuperApp.deployed();

      async function checkUserToAppFlow(
        _user: string,
        expectedAmount: BigNumber
      ) {
        const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
          superToken: paymentToken.address,
          sender: _user,
          receiver: beneSuperApp.address,
          providerOrSigner: await ethers.getSigner(diamondAdmin),
        });

        expect(userToAppFlow.flowRate).to.equal(
          expectedAmount.toString(),
          "User -> App flow is incorrect"
        );
      }

      async function checkJailed(receipt: ContractReceipt) {
        const events = await hostContract.queryFilter(
          hostContract.filters.Jail(null),
          receipt.blockHash
        );

        expect(events, `App was jailed: ${events[0]?.args?.reason}`).to.be
          .empty;

        const isJailed = await hostContract.isAppJailed(beneSuperApp.address);
        expect(isJailed).to.be.false;
      }

      return {
        beneSuperApp,
        checkUserToAppFlow,
        checkJailed,
        mockParamsStore,
        ...res,
      };
    }
  );

  const createOne = deployments.createFixture(
    async ({ getNamedAccounts, ethers }) => {
      const res = await setupTest();
      const { beneSuperApp, ethx_erc20, ethersjsSf } = res;

      const { user } = await getNamedAccounts();

      const flowRate = BigNumber.from(100);
      const op = ethersjsSf.cfaV1.createFlow({
        receiver: beneSuperApp.address,
        flowRate: flowRate.toString(),
        superToken: ethx_erc20.address,
      });

      const opResp = await op.exec(await ethers.getSigner(user));
      const opReceipt = await opResp.wait();

      return {
        opReceipt,
        flowRate,
        ...res,
      };
    }
  );

  describe("deploy", async () => {
    it("should fail if beneficiary is zero", async () => {
      const res = await setupSf();
      const { sf } = res;
      const { diamondAdmin } = await getNamedAccounts();

      const { numerator, denominator } = perYearToPerSecondRate(0.1);

      const mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
      mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
      mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
      mockParamsStore.getPenaltyNumerator.returns(numerator);
      mockParamsStore.getPenaltyDenominator.returns(denominator);
      mockParamsStore.getHost.returns(sf.host.address);
      mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
      mockParamsStore.getBeneficiary.returns(diamondAdmin);
      mockParamsStore.getBidPeriodLengthInSeconds.returns(60 * 60 * 24);
      mockParamsStore.getReclaimAuctionLength.returns(14 * 60 * 60 * 24);

      const BeneficiarySuperApp = await ethers.getContractFactory(
        "BeneficiarySuperApp"
      );
      const beneSuperApp = BeneficiarySuperApp.deploy(
        mockParamsStore.address,
        ethers.constants.AddressZero
      );

      await expect(beneSuperApp).to.be.revertedWith(
        "BeneficiarySuperApp: Beneficiary cannot be 0x0"
      );
    });
  });

  describe("setBeneficiary", async () => {
    it("should set", async () => {
      const { beneSuperApp, ethx_erc20 } = await setupTest();
      const { user, diamondAdmin } = await getNamedAccounts();

      expect(
        await ethx_erc20.allowance(beneSuperApp.address, diamondAdmin)
      ).to.equal(ethers.constants.MaxUint256);

      await beneSuperApp.setBeneficiary(user);

      expect(await beneSuperApp.getBeneficiary()).to.equal(user);
      expect(
        await ethx_erc20.allowance(beneSuperApp.address, diamondAdmin)
      ).to.equal(0);
      expect(await ethx_erc20.allowance(beneSuperApp.address, user)).to.equal(
        ethers.constants.MaxUint256
      );
    });

    it("should fail if not owner", async () => {
      const { beneSuperApp } = await setupTest();
      const { user } = await getNamedAccounts();

      const txn = beneSuperApp
        .connect(await ethers.getSigner(user))
        .setBeneficiary(user);

      await expect(txn).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if address is zero", async () => {
      const { beneSuperApp } = await setupTest();

      const txn = beneSuperApp.setBeneficiary(ethers.constants.AddressZero);

      await expect(txn).to.be.revertedWith(
        "BeneficiarySuperApp: Beneficiary cannot be 0x0"
      );
    });
  });

  describe("getLastDeletion", async () => {
    it("should handle create and delete flow", async () => {
      const {
        beneSuperApp,
        ethx_erc20,
        ethersjsSf,
        checkJailed,
        checkUserToAppFlow,
      } = await createOne();

      const { user } = await getNamedAccounts();

      const op = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: beneSuperApp.address,
        superToken: ethx_erc20.address,
      });

      const opResp = await op.exec(await ethers.getSigner(user));
      const opReceipt = await opResp.wait();
      const opBlock = await ethers.provider.getBlock(opReceipt.blockNumber);

      await checkJailed(opReceipt);
      await checkUserToAppFlow(user, BigNumber.from(0));
      expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(
        opBlock.timestamp
      );
    });

    it("should handle recreate flow", async () => {
      const {
        beneSuperApp,
        ethx_erc20,
        ethersjsSf,
        checkJailed,
        checkUserToAppFlow,
      } = await createOne();

      const { user } = await getNamedAccounts();

      const op = ethersjsSf.cfaV1.deleteFlow({
        sender: user,
        receiver: beneSuperApp.address,
        superToken: ethx_erc20.address,
      });

      const opResp = await op.exec(await ethers.getSigner(user));
      const opReceipt = await opResp.wait();
      const opBlock = await ethers.provider.getBlock(opReceipt.blockNumber);

      const flowRate = BigNumber.from(1000);
      const op1 = ethersjsSf.cfaV1.createFlow({
        receiver: beneSuperApp.address,
        flowRate: flowRate.toString(),
        superToken: ethx_erc20.address,
      });

      await op1.exec(await ethers.getSigner(user));

      await checkJailed(opReceipt);
      await checkUserToAppFlow(user, flowRate);
      expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(
        opBlock.timestamp
      );
    });
  });

  describe("withdraw", async () => {
    it("should allow beneficiary to withdraw", async () => {
      const { beneSuperApp, ethx_erc20, flowRate } = await createOne();

      const { diamondAdmin } = await getNamedAccounts();

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const timeElapsed = 60 * 60 * 24;
      const accumulatedBalance = flowRate.mul(timeElapsed);

      const txn = await ethx_erc20.transferFrom(
        beneSuperApp.address,
        diamondAdmin,
        accumulatedBalance
      );
      await txn.wait();

      const beneficiaryBalance = await ethx_erc20.balanceOf(diamondAdmin);
      expect(beneficiaryBalance).to.equal(accumulatedBalance);
    });

    it("should fail if not beneficiary", async () => {
      const { beneSuperApp, ethx_erc20, flowRate } = await createOne();

      const { user } = await getNamedAccounts();

      // Advance time
      await network.provider.send("evm_increaseTime", [60 * 60 * 24]);
      await network.provider.send("evm_mine");

      const timeElapsed = 60 * 60 * 24;
      const accumulatedBalance = flowRate.mul(timeElapsed);

      const txn = ethx_erc20
        .connect(await ethers.getSigner(user))
        .transferFrom(beneSuperApp.address, user, accumulatedBalance);

      await expect(txn).to.be.revertedWith(
        "SuperToken: transfer amount exceeds allowance"
      );
    });
  });

  describe("afterAgreementTerminated", async () => {
    it("should fail if not called by host", async () => {
      const { beneSuperApp, paymentToken, ethersjsSf } = await setupTest();

      const txn = beneSuperApp.afterAgreementTerminated(
        paymentToken.address,
        ethersjsSf.cfaV1.contract.address,
        ethers.constants.HashZero,
        ethers.constants.HashZero,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      );

      await expect(txn).to.be.revertedWith(
        "BeneficiarySuperApp: support only one host"
      );
    });

    it("should pass if called with different token", async () => {
      const {
        beneSuperApp,
        ethersjsSf,
        sf,
        ethx_erc20,
        checkJailed,
        mockParamsStore,
      } = await setupTest();

      const { user } = await getNamedAccounts();

      mockParamsStore.getPaymentToken.returns(sf.tokens.fDAIx.address);

      const flowRate = BigNumber.from(100);
      const op = ethersjsSf.cfaV1.createFlow({
        receiver: beneSuperApp.address,
        flowRate: flowRate.toString(),
        superToken: ethx_erc20.address,
      });

      const opResp = await op.exec(await ethers.getSigner(user));
      const opReceipt = await opResp.wait();

      await checkJailed(opReceipt);
      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: sf.tokens.fDAIx.address,
        sender: user,
        receiver: beneSuperApp.address,
        providerOrSigner: await ethers.getSigner(user),
      });

      expect(userToAppFlow.flowRate).to.equal(
        "0",
        "User -> App flow is incorrect"
      );
      expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(0);

      mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
    });

    it("should pass if called with different agreement", async () => {
      const {
        beneSuperApp,
        ethersjsSf,
        ethx_erc20,
        checkJailed,
        checkUserToAppFlow,
      } = await setupTest();

      const { user } = await getNamedAccounts();

      const op = ethersjsSf.idaV1.createIndex({
        superToken: ethx_erc20.address,
        indexId: "0",
      });

      await op.exec(await ethers.getSigner(user));

      const op1 = ethersjsSf.idaV1.updateSubscriptionUnits({
        indexId: "0",
        superToken: ethx_erc20.address,
        subscriber: beneSuperApp.address,
        units: "1",
      });
      await op1.exec(await ethers.getSigner(user));

      const op2 = ethersjsSf.idaV1.deleteSubscription({
        indexId: "0",
        superToken: ethx_erc20.address,
        subscriber: beneSuperApp.address,
        publisher: user,
      });
      const opResp = await op2.exec(await ethers.getSigner(user));
      const opReceipt = await opResp.wait();

      await checkJailed(opReceipt);
      await checkUserToAppFlow(user, BigNumber.from(0));
      expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(0);
    });
  });
});
