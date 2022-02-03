import { expect, use } from "chai";
var chaiAsPromised = require("chai-as-promised");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3 } from "hardhat";
import { BatchCall, Framework, SuperToken } from "@superfluid-finance/sdk-core";
import SFError from "@superfluid-finance/sdk-core/dist/main/SFError";
import { BigNumber, Contract } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");

use(chaiAsPromised);

describe("AuctionSuperApp", async () => {  
  let accounts: SignerWithAddress[];

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  async function buildAuctionSuperApp({host, cfa, token, receiver}: {host: any, cfa: any, token: any, receiver: any}) {
    const AuctionSuperApp = await ethers.getContractFactory("AuctionSuperApp");
    const superApp = await AuctionSuperApp.deploy(host, cfa, token, receiver);
    await superApp.deployed();

    return superApp;
  }

  before(async () => {
    accounts = await ethers.getSigners();

    await deployFramework(errorHandler, {
        web3,
        from: accounts[0].address
    });
  });

  it("should only allow admin to set receiver", async () => {
    await deploySuperToken(errorHandler, [":", "ETH"], {
        web3,
        from: accounts[0].address
    });

    const sf = new SuperfluidSDK.Framework({
        web3,
        version: "test",
        tokens: ["ETH"],
    });
    await sf.initialize();

    const superApp = await buildAuctionSuperApp({
        host: sf.host.address,
        cfa: sf.agreements.cfa.address,
        token: sf.tokens.ETHx.address,
        receiver: accounts[0].address
    });

    expect(
      superApp.connect(accounts[1]).setReceiver(accounts[0].address)
    ).to.be.rejected;

    await superApp.setReceiver(accounts[0].address);

    const value = await superApp.receiver();
    expect(value).to.equal(accounts[0].address);
  })

  describe("No current owner bid", async () => {
    let ethx: SuperToken;
    let ethersjsSf: Framework;
    let superApp: Contract;
    let user: SignerWithAddress;
    let mockClaimer: Contract;
    
    beforeEach(async () => {
      await deploySuperToken(errorHandler, [":", "ETH"], {
          web3,
          from: accounts[0].address
      });

      const sf = new SuperfluidSDK.Framework({
          web3,
          version: "test",
          tokens: ["ETH"],
      });
      await sf.initialize();

      const ethersProvider = accounts[0].provider!;
      ethersjsSf = await Framework.create({
          networkName: "custom",
          dataMode: "WEB3_ONLY",
          resolverAddress: sf.resolver.address,
          protocolReleaseVersion: "test",
          provider: ethersProvider
      });

      user = accounts[1];

      ethx = await ethersjsSf.loadSuperToken(sf.tokens.ETHx.address);

      await sf.tokens.ETHx.upgradeByETH({
        from: user.address,
        value: ethers.utils.parseEther("10")
      });

      superApp = await buildAuctionSuperApp({
          host: sf.host.address,
          cfa: sf.agreements.cfa.address,
          token: sf.tokens.ETHx.address,
          receiver: accounts[0].address
      });

      const MockClaimer = await ethers.getContractFactory("MockClaimer");
      mockClaimer = await MockClaimer.deploy();
      await mockClaimer.deployed();

      await superApp.setClaimer(mockClaimer.address);
    });

    it("should claim on flow creation", async () => {
      const startingReceiverBalance = BigNumber.from(await ethx.balanceOf({ account: accounts[0].address, providerOrSigner: accounts[0] }));

      const approveOp = ethx.approve({ receiver: superApp.address, amount: "100" });

      const userData = ethers.utils.defaultAbiCoder.encode([ "uint8", "bytes" ], [ 0, "0x" ]);
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: user.address, 
          receiver: superApp.address,
          flowRate: "100",
          superToken: ethx.address,
          userData: userData
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = await batchCall.exec(accounts[1]);
      await txn.wait();

      const endingReceiverBalance = BigNumber.from(await ethx.balanceOf({ account: accounts[0].address, providerOrSigner: accounts[0] }));

      const value: BigNumber = await mockClaimer.claimCallCount();
      expect(value.toNumber()).to.equal(1, "Claimer not called");

      expect(endingReceiverBalance.sub(startingReceiverBalance).toNumber()).to.equal(100, "Receiver did not receive deposit");
      
      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: user.address,
        receiver: superApp.address,
        providerOrSigner: accounts[0]
      });
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: ethx.address,
        account: superApp.address,
        providerOrSigner: accounts[0]
      });
      const appToReceiverFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: superApp.address,
        receiver: accounts[0].address,
        providerOrSigner: accounts[0]
      });

      expect(userToAppFlow.flowRate).to.equal("100", "User -> App flow is incorrect");
      expect(appNetFlow).to.equal("0", "App net flow is incorrect");
      expect(appToReceiverFlow.flowRate).to.equal("100", "App -> Receiver flow is incorrect");
    })

    it("should claim on flow increase", async () => {
      const approveOp = ethx.approve({ receiver: superApp.address, amount: "200" });

      // Create an initial flow
      const userData = ethers.utils.defaultAbiCoder.encode([ "uint8", "bytes" ], [ 0, "0x" ]);
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: user.address, 
          receiver: superApp.address,
          flowRate: "100",
          superToken: ethx.address,
          userData: userData
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = await batchCall.exec(accounts[1]);
      await txn.wait();

      // Update existing flow
      const userData2 = ethers.utils.defaultAbiCoder.encode([ "uint8", "bytes" ], [ 0, "0x" ]);
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: user.address, 
          receiver: superApp.address,
          flowRate: "200",
          superToken: ethx.address,
          userData: userData2
      });
      const txn1 = await updateFlowOp.exec(accounts[1]);
      await txn1.wait();

      const value: BigNumber = await mockClaimer.claimCallCount();
      expect(value.toNumber()).to.equal(2, "Claimer not called");

      const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: user.address,
        receiver: superApp.address,
        providerOrSigner: accounts[0]
      });
      const appNetFlow = await ethersjsSf.cfaV1.getNetFlow({
        superToken: ethx.address,
        account: superApp.address,
        providerOrSigner: accounts[0]
      });
      const appToReceiverFlow = await ethersjsSf.cfaV1.getFlow({
        superToken: ethx.address,
        sender: superApp.address,
        receiver: accounts[0].address,
        providerOrSigner: accounts[0]
      });
      
      expect(userToAppFlow.flowRate).to.equal("200", "User -> App flow is incorrect");
      expect(appNetFlow).to.equal("0", "App net flow is incorrect");
      expect(appToReceiverFlow.flowRate).to.equal("200", "App -> Receiver flow is incorrect");
    })
  })

//   it("should create Flow(app -> user) equal to Flow(user -> app) on agreement created", async () => {
//     await deploySuperToken(errorHandler, [":", "ETH"], {
//         web3,
//         from: accounts[0].address
//     });

//     const sf = new SuperfluidSDK.Framework({
//         web3,
//         version: "test",
//         tokens: ["ETH"],
//     });
//     await sf.initialize();

//     const ethersProvider = accounts[0].provider!;
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
//         receiver: accounts[0].address
//     });

//     const user = accounts[1].address;
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
//     const txnResponse = await createFlowOperation.exec(accounts[1]);
//     await txnResponse.wait();

//     const flowUserToApp = await ethersjsSf.cfaV1.getFlow({
//         sender: user, 
//         receiver: superApp.address,
//         superToken: sf.tokens.ETHx.address,
//         providerOrSigner: accounts[1]
//     });
//     const flowAppToUser = await ethersjsSf.cfaV1.getFlow({
//         sender: superApp.address,
//         receiver: user,
//         superToken: sf.tokens.ETHx.address,
//         providerOrSigner: accounts[1]
//     });
//     const netFlow = await ethersjsSf.cfaV1.getNetFlow({
//         superToken: sf.tokens.ETHx.address,
//         account: user,
//         providerOrSigner: accounts[1]
//     });
      
//     assert.equal(flowUserToApp.flowRate, "100", "Did not create backflow");
//     assert.equal(flowAppToUser.flowRate, "100", "Did not create backflow");
//     assert.equal(netFlow, "0", "Did not create backflow");
//     assert.equal(await superApp.totalContributionRate(user), "0", "Total contribution is not 0");
//   })
})