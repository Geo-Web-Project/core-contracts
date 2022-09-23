import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { ContractReceipt } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { setupSf, perYearToPerSecondRate } from "../shared";
import { BigNumber, BigNumberish } from "ethers";

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
        mockParamsStore.address
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

      async function checkAppToBeneficiaryFlow(expectedAmount: BigNumber) {
        const appToBeneficiaryFlow = await ethersjsSf.cfaV1.getFlow({
          superToken: paymentToken.address,
          sender: beneSuperApp.address,
          receiver: diamondAdmin,
          providerOrSigner: await ethers.getSigner(diamondAdmin),
        });

        expect(appToBeneficiaryFlow.flowRate).to.equal(
          expectedAmount.toString(),
          "App -> Beneficiary flow is incorrect"
        );
      }

      async function checkAppNetFlow(check?: BigNumberish) {
        const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
          superToken: paymentToken.address,
          account: beneSuperApp.address,
          providerOrSigner: await ethers.getSigner(diamondAdmin),
        });

        expect(appNetFlow).to.equal(
          check?.toString() ?? "0",
          "App net flow is incorrect"
        );
      }

      async function checkAppBalance(check: BigNumberish) {
        const appBalance = await paymentToken.balanceOf({
          account: beneSuperApp.address,
          providerOrSigner: await ethers.getSigner(diamondAdmin),
        });

        expect(appBalance).to.equal(
          check.toString(),
          "App balance is incorrect"
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
        checkAppToBeneficiaryFlow,
        checkAppNetFlow,
        checkAppBalance,
        checkJailed,
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

  const createTwo = deployments.createFixture(
    async ({ getNamedAccounts, ethers }) => {
      const res = await setupTest();
      const { beneSuperApp, ethx_erc20, ethersjsSf } = res;

      const { user, bidder } = await getNamedAccounts();

      const flowRate1 = BigNumber.from(100);
      const op1 = ethersjsSf.cfaV1.createFlow({
        receiver: beneSuperApp.address,
        flowRate: flowRate1.toString(),
        superToken: ethx_erc20.address,
      });

      const op1Resp = await op1.exec(await ethers.getSigner(user));
      await op1Resp.wait();

      const flowRate2 = BigNumber.from(500);
      const op2 = ethersjsSf.cfaV1.createFlow({
        receiver: beneSuperApp.address,
        flowRate: flowRate2.toString(),
        superToken: ethx_erc20.address,
      });

      const op2Resp = await op2.exec(await ethers.getSigner(bidder));
      const opReceipt = await op2Resp.wait();

      return { opReceipt, flowRate1, flowRate2, ...res };
    }
  );

  it("should create first flow to beneficiary", async () => {
    const {
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      opReceipt,
    } = await createOne();

    const { user } = await getNamedAccounts();

    const flowRate = BigNumber.from(100);

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, flowRate);
    await checkAppToBeneficiaryFlow(flowRate);
    await checkAppNetFlow();
    await checkAppBalance(0);
  });

  it("should create and increase first flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate,
    } = await createOne();

    const { user } = await getNamedAccounts();

    const newFlowRate = flowRate.add(100);
    const op = ethersjsSf.cfaV1.updateFlow({
      receiver: beneSuperApp.address,
      flowRate: newFlowRate.toString(),
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(user));
    const opReceipt = await opResp.wait();

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, newFlowRate);
    await checkAppToBeneficiaryFlow(newFlowRate);
    await checkAppNetFlow();
    await checkAppBalance(0);
  });

  it("should create and decrease first flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate,
    } = await createOne();

    const { user } = await getNamedAccounts();

    const newFlowRate = flowRate.sub(50);
    const op = ethersjsSf.cfaV1.updateFlow({
      receiver: beneSuperApp.address,
      flowRate: newFlowRate.toString(),
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(user));
    const opReceipt = await opResp.wait();

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, newFlowRate);
    await checkAppToBeneficiaryFlow(newFlowRate);
    await checkAppNetFlow();
    await checkAppBalance(0);
  });

  it("should create second flow to beneficiary", async () => {
    const {
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      opReceipt,
      flowRate1,
      flowRate2,
    } = await createTwo();

    const { user, bidder } = await getNamedAccounts();

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, flowRate1);
    await checkUserToAppFlow(bidder, flowRate2);
    await checkAppToBeneficiaryFlow(flowRate1.add(flowRate2));
    await checkAppNetFlow();
    await checkAppBalance(0);
  });

  it("should update second flow to beneficiary", async () => {
    const {
      ethersjsSf,
      beneSuperApp,
      ethx_erc20,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate1,
      flowRate2,
    } = await createTwo();

    const { user, bidder } = await getNamedAccounts();

    const newFlowRate = flowRate2.add(100);
    const op = ethersjsSf.cfaV1.updateFlow({
      receiver: beneSuperApp.address,
      flowRate: newFlowRate.toString(),
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(bidder));
    const opReceipt = await opResp.wait();

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, flowRate1);
    await checkUserToAppFlow(bidder, newFlowRate);
    await checkAppToBeneficiaryFlow(newFlowRate.add(flowRate1));
    await checkAppNetFlow();
    await checkAppBalance(0);
  });

  it("should create and delete first flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
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
    await checkAppToBeneficiaryFlow(BigNumber.from(0));
    await checkAppNetFlow();
    await checkAppBalance(0);
    expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(
      opBlock.timestamp
    );
  });

  it("should create and delete second flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate1,
    } = await createTwo();

    const { user, bidder } = await getNamedAccounts();

    const op = ethersjsSf.cfaV1.deleteFlow({
      sender: bidder,
      receiver: beneSuperApp.address,
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(bidder));
    const opReceipt = await opResp.wait();
    const opBlock = await ethers.provider.getBlock(opReceipt.blockNumber);

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, flowRate1);
    await checkUserToAppFlow(bidder, BigNumber.from(0));
    await checkAppToBeneficiaryFlow(flowRate1);
    await checkAppNetFlow();
    await checkAppBalance(0);
    expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(0);
    expect(await beneSuperApp.getLastDeletion(bidder)).to.be.equal(
      opBlock.timestamp
    );
  });

  it("should recreate first flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
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
    await checkAppToBeneficiaryFlow(flowRate);
    await checkAppNetFlow();
    await checkAppBalance(0);
    expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(
      opBlock.timestamp
    );
  });

  it("should recreate second flow to beneficiary", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate1,
    } = await createTwo();

    const { user, bidder } = await getNamedAccounts();

    const op = ethersjsSf.cfaV1.deleteFlow({
      sender: bidder,
      receiver: beneSuperApp.address,
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(bidder));
    const opReceipt = await opResp.wait();
    const opBlock = await ethers.provider.getBlock(opReceipt.blockNumber);

    const newFlowRate = BigNumber.from(1000);
    const op1 = ethersjsSf.cfaV1.createFlow({
      receiver: beneSuperApp.address,
      flowRate: newFlowRate.toString(),
      superToken: ethx_erc20.address,
    });

    await op1.exec(await ethers.getSigner(bidder));

    await checkJailed(opReceipt);
    await checkUserToAppFlow(user, flowRate1);
    await checkUserToAppFlow(bidder, newFlowRate);
    await checkAppToBeneficiaryFlow(flowRate1.add(newFlowRate));
    await checkAppNetFlow();
    await checkAppBalance(0);
    expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(0);
    expect(await beneSuperApp.getLastDeletion(bidder)).to.be.equal(
      opBlock.timestamp
    );
  });

  it("should not delete if already deleted", async () => {
    const {
      beneSuperApp,
      ethx_erc20,
      ethersjsSf,
      checkJailed,
      checkUserToAppFlow,
      checkAppToBeneficiaryFlow,
      checkAppNetFlow,
      checkAppBalance,
      flowRate,
    } = await createOne();

    const { user, diamondAdmin } = await getNamedAccounts();

    const op0 = ethersjsSf.cfaV1.deleteFlow({
      sender: beneSuperApp.address,
      receiver: diamondAdmin,
      superToken: ethx_erc20.address,
    });
    const op0Resp = await op0.exec(await ethers.getSigner(diamondAdmin));
    const opReceipt0 = await op0Resp.wait();

    const op = ethersjsSf.cfaV1.deleteFlow({
      sender: user,
      receiver: beneSuperApp.address,
      superToken: ethx_erc20.address,
    });

    const opResp = await op.exec(await ethers.getSigner(user));
    const opReceipt1 = await opResp.wait();

    const opBlock0 = await ethers.provider.getBlock(opReceipt0.blockNumber);
    const opBlock1 = await ethers.provider.getBlock(opReceipt1.blockNumber);

    const timeElapsed = opBlock1.timestamp - opBlock0.timestamp;
    const surplus = flowRate.mul(timeElapsed);

    await checkJailed(opReceipt1);
    await checkUserToAppFlow(user, BigNumber.from(0));
    await checkAppToBeneficiaryFlow(BigNumber.from(0));
    await checkAppNetFlow();
    await checkAppBalance(surplus);
    expect(await beneSuperApp.getLastDeletion(user)).to.be.equal(
      opBlock1.timestamp
    );
  });
});
