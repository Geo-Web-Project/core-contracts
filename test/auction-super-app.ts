import { assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const BigNumber = ethers.BigNumber;
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");

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

    var err;
    try {
      await superApp.connect(accounts[1]).setReceiver(accounts[0].address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await superApp.setReceiver(accounts[0].address);

    const value = await superApp.receiver();
    assert(value == accounts[0].address, "Value was not updated");
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