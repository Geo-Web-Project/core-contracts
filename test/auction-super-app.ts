import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, web3, waffle } from "hardhat";
import { Framework, SFError, SuperToken } from "@superfluid-finance/sdk-core";
import {
  BigNumber,
  Contract,
  ContractReceipt,
  ContractTransaction,
} from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { solidity } from "ethereum-waffle";
import { AuctionSuperApp } from "../typechain-types/AuctionSuperApp";
import { AuctionSuperApp__factory } from "../typechain-types/factories/AuctionSuperApp__factory";
import { ISuperfluid } from "../typechain-types/ISuperfluid";
import { MockClaimer } from "../typechain-types/MockClaimer";
import { MockAccountant } from "../typechain-types/MockAccountant";
import { MockERC721License } from "../typechain-types/MockERC721License";
import {
  Accountant,
  ERC721License,
  MockAccountant__factory,
  MockClaimer__factory,
} from "../typechain-types";
import { FakeContract, smock } from "@defi-wonderland/smock";

use(solidity);
use(chaiAsPromised);

describe("AuctionSuperApp", async () => {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let bidder: SignerWithAddress;
  let other: SignerWithAddress;
  let ethx: SuperToken;
  let ethx_erc20: Contract;
  let ethersjsSf: Framework;
  let superApp: AuctionSuperApp;
  let mockClaimer: MockClaimer;
  let mockAccountant: FakeContract<Accountant>;
  let mockLicense: FakeContract<ERC721License>;
  let sf: any;
  let hostContract: ISuperfluid;

  enum Action {
    CLAIM,
    BID,
  }

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  async function rateToPurchasePrice(rate: BigNumber) {
    const perSecondFeeNumerator = await mockAccountant.perSecondFeeNumerator();
    const perSecondFeeDenominator =
      await mockAccountant.perSecondFeeDenominator();

    return rate.mul(perSecondFeeDenominator).div(perSecondFeeNumerator);
  }

  function perYearToPerSecondRate(annualRate: number) {
    return {
      numerator: annualRate * 100,
      denominator: 60 * 60 * 24 * 365 * 100,
    };
  }

  async function buildAuctionSuperApp({
    host,
    cfa,
    token,
    receiver,
    accountant,
    license,
  }: {
    host: string;
    cfa: string;
    token: string;
    receiver: string;
    accountant: string;
    license: string;
  }) {
    const factory = new AuctionSuperApp__factory(admin);
    const superApp: AuctionSuperApp = await factory.deploy(
      host,
      cfa,
      token,
      receiver,
      license,
      accountant
    );
    await superApp.deployed();

    return superApp;
  }

  async function claimSuccess(
    _user: SignerWithAddress,
    mockLicenseId?: number,
    approveAmount?: BigNumber
  ) {
    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: approveAmount?.toString() ?? "1000",
    });

    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.CLAIM, actionData]
    );
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: _user.address,
      receiver: superApp.address,
      flowRate: "100",
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
    const txn = await batchCall.exec(_user);

    mockLicense.ownerOf
      .whenCalledWith(mockLicenseId ?? 1)
      .returns(_user.address);
    mockAccountant.contributionRates
      .whenCalledWith(mockLicenseId ?? 1)
      .returns(BigNumber.from(100));
    return txn;
  }

  async function placeBidSuccess(
    _bidder: SignerWithAddress,
    mockLicenseId?: number
  ) {
    const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: purchasePrice.toString(),
    });

    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.BID, actionData]
    );
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: _bidder.address,
      receiver: superApp.address,
      flowRate: "200",
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
    const txn1 = await batchCall.exec(_bidder);
    return txn1;
  }

  async function checkUserToAppFlow(
    expectedAmount: string,
    _user?: SignerWithAddress
  ) {
    const userToAppFlow = await ethersjsSf.cfaV1.getFlow({
      superToken: ethx.address,
      sender: (_user ?? user).address,
      receiver: superApp.address,
      providerOrSigner: admin,
    });

    expect(userToAppFlow.flowRate).to.equal(
      expectedAmount,
      "User -> App flow is incorrect"
    );
  }

  async function checkAppToUserFlow(
    expectedAmount: string,
    _user?: SignerWithAddress
  ) {
    const appToUserFlow = await ethersjsSf.cfaV1.getFlow({
      superToken: ethx.address,
      sender: superApp.address,
      receiver: (_user ?? user).address,
      providerOrSigner: admin,
    });

    expect(appToUserFlow.flowRate).to.equal(
      expectedAmount,
      "App -> User flow is incorrect"
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

    [admin, user, bidder, other] = accounts;

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

    await sf.tokens.ETHx.upgradeByETH({
      from: bidder.address,
      value: ethers.utils.parseEther("10"),
    });

    await sf.tokens.ETHx.upgradeByETH({
      from: other.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  beforeEach(async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    mockAccountant = await smock.fake<Accountant>("Accountant");
    mockAccountant.perSecondFeeNumerator.returns(numerator);
    mockAccountant.perSecondFeeDenominator.returns(denominator);

    mockLicense = await smock.fake<ERC721License>("ERC721License");

    superApp = await buildAuctionSuperApp({
      host: sf.host.address,
      cfa: sf.agreements.cfa.address,
      token: sf.tokens.ETHx.address,
      receiver: admin.address,
      accountant: mockAccountant.address,
      license: mockLicense.address,
    });

    const mockClaimerFactory = new MockClaimer__factory(admin);
    mockClaimer = await mockClaimerFactory.deploy();
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
      const txn = await claimSuccess(user);
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
      const txn = await claimSuccess(user);
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
      const txn = await claimSuccess(user);
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

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);

      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: superApp.address,
        receiver: bidder.address,
        superToken: ethx.address,
      });
      const txn2 = await deleteFlowOp.exec(bidder);
      const receipt = await txn2.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
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
      const txn = await claimSuccess(user);
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
      const txn = await claimSuccess(user);
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
      const txn = await claimSuccess(user);
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

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [2, "0x"]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: superApp.address,
        receiver: bidder.address,
        superToken: ethx.address,
        userData: userData,
      });
      const txn2 = await deleteFlowOp.exec(bidder);
      const receipt = await txn2.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
    });
  });

  describe("Random user data", async () => {
    it("should revert on flow create", async () => {
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [ethers.utils.randomBytes(8)]
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
      const txn = await claimSuccess(user);
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [ethers.utils.randomBytes(8)]
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
      const txn = await claimSuccess(user);
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [ethers.utils.randomBytes(8)]
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
      const txn = await claimSuccess(user);
      await txn.wait();

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [ethers.utils.randomBytes(8)]
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

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [ethers.utils.randomBytes(8)]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: superApp.address,
        receiver: bidder.address,
        superToken: ethx.address,
        userData: userData,
      });
      const txn2 = await deleteFlowOp.exec(bidder);
      const receipt = await txn2.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
    });
  });

  describe("CLAIM Action", async () => {
    it("should claim on flow create", async () => {
      const txn = await claimSuccess(user);
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
      const txn = await claimSuccess(user);
      await txn.wait();

      // Update existing flow
      const actionData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: "300",
        superToken: ethx.address,
        userData: userData,
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
      const txn = await claimSuccess(user);
      await txn.wait();

      // Update existing flow
      const actionData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
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
      const txn = await claimSuccess(user);
      await txn.wait();

      const actionData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const userData2 = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
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

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [0, "0x"]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: superApp.address,
        receiver: bidder.address,
        superToken: ethx.address,
        userData: userData,
      });
      const txn2 = await deleteFlowOp.exec(bidder);
      const receipt = await txn2.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
    });
  });

  describe("BID - New highest bidder", async () => {
    it("should place bid on flow create", async () => {
      let existingLicenseId = 1;

      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: bidder.address,
        receiver: superApp.address,
        flowRate: "200",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn1 = await batchCall.exec(bidder);
      const receipt = await txn1.wait();

      await expect(txn1)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(bidder.address, superApp.address, purchasePrice);

      await checkJailed(receipt);
      await checkAppNetFlow();
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
      await checkUserToAppFlow("100", user);
      await checkAppToReceiverFlow("100");
    });

    it("should place bid on flow increase", async () => {
      let existingLicenseId = 1;

      // User 1 claim
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      // User 2 claim
      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const txn1 = await claimSuccess(bidder, 2);
      await txn1.wait();

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: bidder.address,
        receiver: superApp.address,
        flowRate: "300",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
      const txn2 = await batchCall.exec(bidder);
      const receipt = await txn2.wait();

      await expect(txn2)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(bidder.address, superApp.address, purchasePrice);
      await checkJailed(receipt);
      await checkAppNetFlow();
      await checkUserToAppFlow("300", bidder);
      await checkAppToUserFlow("200", bidder);
      await checkUserToAppFlow("100", user);
      await checkAppToReceiverFlow("200");
    });

    it("should revert on flow create when outstanding bid exists", async () => {
      let existingLicenseId = 2;

      const txn = await claimSuccess(user);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: other.address,
        receiver: superApp.address,
        flowRate: "300",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn2 = batchCall.exec(bidder);
      await expect(txn2).to.be.rejected;
    });

    it("should revert on flow increase when outstanding bid exists", async () => {
      let existingLicenseId = 2;

      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      const txn2 = await claimSuccess(other, 1);
      await txn2.wait();

      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: other.address,
        receiver: superApp.address,
        flowRate: "300",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
      const txn3 = batchCall.exec(bidder);
      await expect(txn3).to.be.rejected;
    });

    it("should revert on flow create when bid is not high enough", async () => {
      let existingLicenseId = 2;

      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: other.address,
        receiver: superApp.address,
        flowRate: "100",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn1 = batchCall.exec(bidder);
      await expect(txn1).to.be.rejected;
    });

    it("should revert on flow increase when bid is not high enough", async () => {
      let existingLicenseId = 2;

      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await claimSuccess(bidder, 1);
      await txn1.wait();

      const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: purchasePrice.toString(),
      });

      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [existingLicenseId]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: other.address,
        receiver: superApp.address,
        flowRate: "200",
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn2 = batchCall.exec(bidder);
      await expect(txn2).to.be.rejected;
    });

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimSuccess(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidSuccess(bidder, existingLicenseId);
      await txn1.wait();

      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);

      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [1, "0x"]
      );
      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: superApp.address,
        receiver: bidder.address,
        superToken: ethx.address,
        userData: userData,
      });
      const txn2 = await deleteFlowOp.exec(bidder);
      const receipt = await txn2.wait();

      await checkJailed(receipt);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("200", bidder);
    });
  });
});
