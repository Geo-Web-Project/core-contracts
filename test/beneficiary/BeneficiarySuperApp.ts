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
