import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3, waffle } from "hardhat";
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, Contract, ContractReceipt } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { solidity } from "ethereum-waffle";
import { AuctionSuperApp } from "../typechain-types/AuctionSuperApp";
import { AuctionSuperApp__factory } from "../typechain-types/factories/AuctionSuperApp__factory";
import { ISuperfluid } from "../typechain-types/ISuperfluid";
import { MockClaimer } from "../typechain-types/MockClaimer";

use(solidity);
use(chaiAsPromised);

describe("AuctionSuperApp", async () => {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let ethx: SuperToken;
  let ethx_erc20: Contract;
  let ethersjsSf: Framework;
  let superApp: AuctionSuperApp;
  let mockClaimer: MockClaimer;
  let sf: any;
  let hostContract: ISuperfluid;

  enum Action {
    CLAIM,
    BID,
  }

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  async function buildAuctionSuperApp({
    host,
    cfa,
    token,
    receiver,
  }: {
    host: any;
    cfa: any;
    token: any;
    receiver: any;
  }) {
    const factory = new AuctionSuperApp__factory(admin);
    const superApp: AuctionSuperApp = await factory.deploy(
      host,
      cfa,
      token,
      receiver
    );
    await superApp.deployed();

    return superApp;
  }

  async function claimSuccess() {
    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: "1000",
    });

    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.CLAIM, "0x"]
    );
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: user.address,
      receiver: superApp.address,
      flowRate: "100",
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
    const txn = await batchCall.exec(user);
    return txn;
  }

  async function checkUserToAppFlow(expectedAmount: string) {
    const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
      superToken: ethx.address,
      sender: user.address,
      receiver: superApp.address,
      providerOrSigner: admin,
    });

    expect(userToAppFlow.flowRate).to.equal(
      expectedAmount,
      "User -> App flow is incorrect"
    );
  }

  async function checkAppToReceiverFlow(expectedAmount: string) {
    const appToReceiverFlow = await ethersjsSf.cfaV1.getFlow({
      superToken: ethx.address,
      sender: superApp.address,
      receiver: admin.address,
      providerOrSigner: admin,
    });

    expect(appToReceiverFlow.flowRate).to.equal(
      expectedAmount,
      "App -> Receiver flow is incorrect"
    );
  }

  async function checkAppNetFlow() {
    const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
      superToken: ethx.address,
      account: superApp.address,
      providerOrSigner: admin,
    });

    expect(appNetFlow).to.equal("0", "App net flow is incorrect");
  }

  async function checkClaimCallCount(expectedCount: number) {
    const value: BigNumber = await mockClaimer.claimCallCount();
    expect(value).to.equal(expectedCount, "Claimer not called");
  }

  async function checkClaimLastContribution(
    user: string,
    expectedContribution: number
  ) {
    const value: BigNumber = await mockClaimer.lastContribution(user);
    expect(value).to.equal(
      expectedContribution,
      "Last contribution is incorrect"
    );
  }

  async function checkJailed(receipt: ContractReceipt) {
    const events = await hostContract.queryFilter(
      hostContract.filters.Jail(null),
      receipt.blockHash
    );

    expect(events, `App was jailed: ${events[0]?.args?.reason}`).to.be.empty;
  }

  before(async () => {
    accounts = await ethers.getSigners();

    [admin, user] = accounts;

    await deployFramework(errorHandler, {
      web3,
      from: admin.address,
    });

    await deploySuperToken(errorHandler, [":", "ETH"], {
      web3,
      from: admin.address,
    });

    sf = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: ["ETH"],
    });
    await sf.initialize();

    const ethersProvider = admin.provider!;
    ethersjsSf = await Framework.create({
      networkName: "custom",
      dataMode: "WEB3_ONLY",
      resolverAddress: sf.resolver.address,
      protocolReleaseVersion: "test",
      provider: ethersProvider,
    });

    ethx = await ethersjsSf.loadSuperToken(sf.tokens.ETHx.address);
    ethx_erc20 = await ethers.getContractAt("IERC20", sf.tokens.ETHx.address);
    hostContract = await ethers.getContractAt("ISuperfluid", sf.host.address);

    await sf.tokens.ETHx.upgradeByETH({
      from: user.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  beforeEach(async () => {
    superApp = await buildAuctionSuperApp({
      host: sf.host.address,
      cfa: sf.agreements.cfa.address,
      token: sf.tokens.ETHx.address,
      receiver: admin.address,
    });

    const MockClaimer = await ethers.getContractFactory("MockClaimer");
    mockClaimer = await MockClaimer.deploy();
    await mockClaimer.deployed();

    await superApp.setClaimer(mockClaimer.address);
  });

  it("should only allow admin to set receiver", async () => {
    expect(
      superApp.connect(user).setReceiver(admin.address)
    ).to.be.revertedWith("is missing role");

    await superApp.setReceiver(admin.address);

    const value = await superApp.receiver();
    expect(value).to.equal(admin.address);
  });

  describe("No user data", async () => {
    it("should revert on flow create", async () => {
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "100",
        superToken: ethx.address,
      });

      const txn = createFlowOp.exec(user);
      await expect(txn).to.be.rejected;
    });

    it("should revert on flow increase", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "200",
        superToken: ethx.address,
      });
      const txn1 = updateFlowOp.exec(user);
      await expect(txn1).to.be.rejected;
    });

    it("should revert on flow decrease", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "50",
        superToken: ethx.address,
      });
      const txn1 = updateFlowOp.exec(user);
      await expect(txn1).to.be.rejected;
    });

    it("should delete Flow(app -> user) on flow delete", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: user.address,
        receiver: superApp.address,
        superToken: ethx.address,
      });
      const txn1 = await deleteFlowOp.exec(user);
      const receipt = await txn1.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("0");
      await checkAppToReceiverFlow("0");
      await checkAppNetFlow();
    });
  });

  describe("Unknown Action", async () => {
    it("should revert on flow create", async () => {
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [2, "0x"]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "100",
        superToken: ethx.address,
        userData: userData,
      });

      const txn = createFlowOp.exec(user);
      await expect(txn).to.be.rejected;
    });

    it("should revert on flow increase", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [2, "0x"]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "200",
        superToken: ethx.address,
        userData: userData,
      });
      const txn1 = updateFlowOp.exec(user);
      await expect(txn1).to.be.rejected;
    });

    it("should revert on flow decrease", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [2, "0x"]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "50",
        superToken: ethx.address,
        userData: userData,
      });
      const txn1 = updateFlowOp.exec(user);
      await expect(txn1).to.be.rejected;
    });

    it("should delete Flow(app -> user) on flow delete", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [2, "0x"]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: user.address,
        receiver: superApp.address,
        superToken: ethx.address,
        userData: userData,
      });
      const txn1 = await deleteFlowOp.exec(user);
      const receipt = await txn1.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("0");
      await checkAppToReceiverFlow("0");
      await checkAppNetFlow();
    });
  });

  describe("CLAIM Action", async () => {
    it("should claim on flow create", async () => {
      const txn = await claimSuccess();
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const receipt = await txn.wait();

      await checkJailed(receipt);
      await checkClaimCallCount(1);
      await checkClaimLastContribution(user.address, 100);
      await checkAppNetFlow();
      await checkUserToAppFlow("100");
      await checkAppToReceiverFlow("100");
    });

    it("should claim on flow increase", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      // Update existing flow
      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, "0x"]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "300",
        superToken: ethx.address,
        userData: userData2,
      });
      const txn1 = await updateFlowOp.exec(user);
      await expect(txn1)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);
      const receipt = await txn1.wait();

      await checkJailed(receipt);

      await checkClaimCallCount(2);
      await checkClaimLastContribution(user.address, 200);
      await checkAppNetFlow();
      await checkUserToAppFlow("300");
      await checkAppToReceiverFlow("300");
    });

    it("should revert on flow decrease", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      // Update existing flow
      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, "0x"]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "50",
        superToken: ethx.address,
        userData: userData2,
      });
      const txn1 = updateFlowOp.exec(user);
      await expect(txn1).to.be.rejected;
    });

    it("should delete Flow(app -> user) on flow delete", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, "0x"]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: user.address,
        receiver: superApp.address,
        superToken: ethx.address,
        userData: userData2,
      });
      const txn1 = await deleteFlowOp.exec(user);
      const receipt = await txn1.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("0");
      await checkAppToReceiverFlow("0");
      await checkAppNetFlow();
    });
  });

  //   it("should create Flow(app -> user) equal to Flow(user -> app) on agreement created", async () => {
  //     await deploySuperToken(errorHandler, [":", "ETH"], {
  //         web3,
  //         from: admin.address
  //     });

  //     const sf = new SuperfluidSDK.Framework({
  //         web3,
  //         version: "test",
  //         tokens: ["ETH"],
  //     });
  //     await sf.initialize();

  //     const ethersProvider = admin.provider!;
  //     const ethersjsSf = await Framework.create({
  //         networkName: "custom",
  //         dataMode: "WEB3_ONLY",
  //         resolverAddress: sf.resolver.address,
  //         protocolReleaseVersion: "test",
  //         provider: ethersProvider
  //     });

  //     const superApp = await buildCollectorSuperApp({
  //         host: sf.host.address,
  //         cfa: sf.agreements.cfa.address,
  //         token: sf.tokens.ETHx.address,
  //         receiver: admin.address
  //     });

  //     const user = user.address;
  //     await sf.tokens.ETHx.upgradeByETH({
  //         from: user,
  //         value: ethers.utils.parseEther("10")
  //     });

  //     const createFlowOperation = await ethersjsSf.cfaV1.createFlow({
  //         sender: user,
  //         receiver: superApp.address,
  //         flowRate: "100",
  //         superToken: sf.tokens.ETHx.address
  //     });
  //     const txnResponse = await createFlowOperation.exec(user);
  //     await txnResponse.wait();

  //     const flowUserToApp = await ethersjsSf.cfaV1.getFlow({
  //         sender: user,
  //         receiver: superApp.address,
  //         superToken: sf.tokens.ETHx.address,
  //         providerOrSigner: user
  //     });
  //     const flowAppToUser = await ethersjsSf.cfaV1.getFlow({
  //         sender: superApp.address,
  //         receiver: user,
  //         superToken: sf.tokens.ETHx.address,
  //         providerOrSigner: user
  //     });
  //     const netFlow = await ethersjsSf.cfaV1.getNetFlow({
  //         superToken: sf.tokens.ETHx.address,
  //         account: user,
  //         providerOrSigner: user
  //     });

  //     assert.equal(flowUserToApp.flowRate, "100", "Did not create backflow");
  //     assert.equal(flowAppToUser.flowRate, "100", "Did not create backflow");
  //     assert.equal(netFlow, "0", "Did not create backflow");
  //     assert.equal(await superApp.totalContributionRate(user), "0", "Total contribution is not 0");
  //   })
});
