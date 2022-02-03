import { expect, use } from "chai";
var chaiAsPromised = require("chai-as-promised");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3 } from "hardhat";
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, Contract } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { solidity } from "ethereum-waffle";

use(chaiAsPromised);
use(solidity);

describe("AuctionSuperApp", async () => {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let ethx: SuperToken;
  let ethx_erc20: Contract;
  let ethersjsSf: Framework;
  let superApp: Contract;
  let mockClaimer: Contract;
  let sf: any;

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
    const AuctionSuperApp = await ethers.getContractFactory("AuctionSuperApp");
    const superApp = await AuctionSuperApp.deploy(host, cfa, token, receiver);
    await superApp.deployed();

    return superApp;
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

  async function claimSuccess() {
    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: "1000",
    });

    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [0, "0x"]
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

  it("should only allow admin to set receiver", async () => {
    expect(
      superApp.connect(user).setReceiver(admin.address)
    ).to.be.revertedWith("is missing role");

    await superApp.setReceiver(admin.address);

    const value = await superApp.receiver();
    expect(value).to.equal(admin.address);
  });

  it("should revert flow create on missing user data", async () => {
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: user.address,
      receiver: superApp.address,
      flowRate: "100",
      superToken: ethx.address,
    });

    const txn = createFlowOp.exec(user);
    await expect(txn).to.be.rejected;
  });

  it("should revert flow update on missing user data", async () => {
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

  it("should revert flow create on unknown action", async () => {
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

  it("should revert flow update on unknown action", async () => {
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

  describe("No current owner bid", async () => {
    it("should claim on flow creation", async () => {
      const txn = await claimSuccess();
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const value: BigNumber = await mockClaimer.claimCallCount();
      expect(value).to.equal(1, "Claimer not called");

      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: user.address,
        receiver: superApp.address,
        providerOrSigner: admin,
      });
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: ethx.address,
        account: superApp.address,
        providerOrSigner: admin,
      });
      const appToReceiverFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: superApp.address,
        receiver: admin.address,
        providerOrSigner: admin,
      });

      expect(userToAppFlow.flowRate).to.equal(
        "100",
        "User -> App flow is incorrect"
      );
      expect(appNetFlow).to.equal("0", "App net flow is incorrect");
      expect(appToReceiverFlow.flowRate).to.equal(
        "100",
        "App -> Receiver flow is incorrect"
      );
    });

    it("should claim on flow increase", async () => {
      const txn = await claimSuccess();
      await txn.wait();

      // Update existing flow
      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [0, "0x"]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "200",
        superToken: ethx.address,
        userData: userData2,
      });
      const txn1 = await updateFlowOp.exec(user);
      await expect(txn1)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const value: BigNumber = await mockClaimer.claimCallCount();
      expect(value).to.equal(2, "Claimer not called");

      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: user.address,
        receiver: superApp.address,
        providerOrSigner: admin,
      });
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: ethx.address,
        account: superApp.address,
        providerOrSigner: admin,
      });
      const appToReceiverFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: superApp.address,
        receiver: admin.address,
        providerOrSigner: admin,
      });

      expect(userToAppFlow.flowRate).to.equal(
        "200",
        "User -> App flow is incorrect"
      );
      expect(appNetFlow).to.equal("0", "App net flow is incorrect");
      expect(appToReceiverFlow.flowRate).to.equal(
        "200",
        "App -> Receiver flow is incorrect"
      );
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
