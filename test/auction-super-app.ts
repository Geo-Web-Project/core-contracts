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
import { AuctionSuperApp } from "../typechain-types/AuctionSuperApp";
import { AuctionSuperApp__factory } from "../typechain-types/factories/AuctionSuperApp__factory";
import { ISuperfluid } from "../typechain-types/ISuperfluid";
import { MockClaimer } from "../typechain-types/MockClaimer";
import {
  ERC721License,
  IClaimer,
  MockClaimer__factory,
} from "../typechain-types";
import { FakeContract, smock } from "@defi-wonderland/smock";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("AuctionSuperApp", async function () {
  this.timeout(0);

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
  let mockLicense: FakeContract<ERC721License>;
  let mockReclaimer: FakeContract<IClaimer>;
  let sf: any;
  let hostContract: ISuperfluid;

  enum Action {
    CLAIM,
    BID,
  }

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  async function debugSFError(f: () => void) {
    try {
      await f();
    } catch (err) {
      let e = err as SFError;
      console.log(e.errorObject);
    }
  }

  async function calculatePenaltyAmount(rate: BigNumber) {
    const penaltyNumerator = await superApp.penaltyNumerator();
    const penaltyDenominator = await superApp.penaltyDenominator();

    return rate.mul(penaltyNumerator).div(penaltyDenominator);
  }

  async function rateToPurchasePrice(rate: BigNumber) {
    const perSecondFeeNumerator = await superApp.perSecondFeeNumerator();
    const perSecondFeeDenominator = await superApp.perSecondFeeDenominator();

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
    beneficiary,
    license,
    claimer,
    reclaimer,
    perSecondFeeNumerator,
    perSecondFeeDenominator,
    penaltyNumerator,
    penaltyDenominator,
    bidPeriodLengthInSeconds,
  }: {
    host: string;
    cfa: string;
    token: string;
    beneficiary: string;
    license: string;
    claimer: string;
    reclaimer: string;
    perSecondFeeNumerator: BigNumber;
    perSecondFeeDenominator: BigNumber;
    penaltyNumerator: BigNumber;
    penaltyDenominator: BigNumber;
    bidPeriodLengthInSeconds: BigNumber;
  }) {
    const factory = new AuctionSuperApp__factory(admin);
    const superApp: AuctionSuperApp = await factory.deploy(
      host,
      cfa,
      token,
      beneficiary,
      license,
      claimer,
      reclaimer,
      perSecondFeeNumerator,
      perSecondFeeDenominator,
      penaltyNumerator,
      penaltyDenominator,
      bidPeriodLengthInSeconds
    );
    await superApp.deployed();

    return superApp;
  }

  async function claimCreate(
    _user: SignerWithAddress,
    mockLicenseId?: number,
    approveAmount?: BigNumber
  ) {
    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: approveAmount?.toString() ?? "1000",
    });

    const claimData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [await rateToPurchasePrice(BigNumber.from(100)), claimData]
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
    return txn;
  }

  async function claimMediumCreate(
    _user: SignerWithAddress,
    mockLicenseId?: number,
    approveAmount?: BigNumber
  ) {
    const contributionRate = BigNumber.from(317097919);
    const forSalePrice = ethers.utils.parseEther("0.1");

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: approveAmount?.toString() ?? "1000",
    });

    const claimData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [forSalePrice, claimData]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.CLAIM, actionData]
    );
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: _user.address,
      receiver: superApp.address,
      flowRate: contributionRate.toString(),
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
    const txn = await batchCall.exec(_user);

    mockLicense.ownerOf
      .whenCalledWith(mockLicenseId ?? 1)
      .returns(_user.address);
    return txn;
  }

  async function claimUpdate(
    _user: SignerWithAddress,
    mockLicenseId?: number,
    approveAmount?: BigNumber
  ) {
    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: approveAmount?.toString() ?? "1000",
    });

    const existingFlow = await ethersjsSf.cfaV1.getFlow({
      sender: _user.address,
      receiver: superApp.address,
      superToken: ethx.address,
      providerOrSigner: user,
    });

    const claimData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [await rateToPurchasePrice(BigNumber.from(100)), claimData]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.CLAIM, actionData]
    );

    const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
      sender: _user.address,
      receiver: superApp.address,
      flowRate: BigNumber.from(existingFlow.flowRate).add(100).toString(),
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
    const txn = await batchCall.exec(_user);

    mockLicense.ownerOf
      .whenCalledWith(mockLicenseId ?? 1)
      .returns(_user.address);
    return txn;
  }

  async function placeBidCreate(
    _bidder: SignerWithAddress,
    mockLicenseId?: number
  ) {
    const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: purchasePrice.toString(),
    });

    const bidData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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

  async function placeLargeBidCreate(
    _bidder: SignerWithAddress,
    mockLicenseId?: number
  ) {
    const contributionRate = BigNumber.from(3170979198);
    const forSalePrice = ethers.utils.parseEther("1.0");

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: ethers.utils.parseEther("1.0").toString(),
    });

    const bidData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [forSalePrice, bidData]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.BID, actionData]
    );
    const createFlowOp = await ethersjsSf.cfaV1.createFlow({
      sender: _bidder.address,
      receiver: superApp.address,
      flowRate: contributionRate.toString(),
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
    const txn1 = await batchCall.exec(_bidder);
    return txn1;
  }

  async function placeBidUpdate(
    _bidder: SignerWithAddress,
    mockLicenseId?: number
  ) {
    const existingFlow = await ethersjsSf.cfaV1.getFlow({
      sender: _bidder.address,
      receiver: superApp.address,
      superToken: ethx.address,
      providerOrSigner: _bidder,
    });

    let existingContributionRate = await superApp.ownerBidContributionRate(
      mockLicenseId ?? 1
    );

    const currentOwner = (
      await superApp.currentOwnerBid(mockLicenseId ?? 1)
    )[1];
    const purchasePrice = await rateToPurchasePrice(existingContributionRate);

    const forSalePrice = await rateToPurchasePrice(
      existingContributionRate.add(200)
    );

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: purchasePrice.toString(),
    });

    const bidData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [forSalePrice, bidData]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.BID, actionData]
    );
    const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
      sender: _bidder.address,
      receiver: superApp.address,
      flowRate: BigNumber.from(existingFlow.flowRate)
        .add(
          currentOwner == _bidder.address
            ? BigNumber.from(0)
            : existingContributionRate
        )
        .add(200)
        .toString(),
      superToken: ethx.address,
      userData: userData,
    });

    const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
    const txn1 = await batchCall.exec(_bidder);
    return txn1;
  }

  async function rejectBid(_user: SignerWithAddress, mockLicenseId?: number) {
    const outstandingBid = await superApp.outstandingBid(mockLicenseId ?? 1);
    const penaltyAmount = await calculatePenaltyAmount(
      outstandingBid.forSalePrice
    );

    const approveOp = ethx.approve({
      receiver: superApp.address,
      amount: penaltyAmount.toString(),
    });

    const bidData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [mockLicenseId ?? 1]
    );
    const actionData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [outstandingBid.forSalePrice, bidData]
    );
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Action.BID, actionData]
    );
    const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
      receiver: superApp.address,
      flowRate: outstandingBid.contributionRate.toString(),
      superToken: ethx.address,
      userData: userData,
    });
    const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);

    const txn = await batchCall.exec(_user);
    return txn;
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

  async function checkAppToBeneficiaryFlow(expectedAmount: string) {
    const appToBeneficiaryFlow = await ethersjsSf.cfaV1.getFlow({
      superToken: ethx.address,
      sender: superApp.address,
      receiver: admin.address,
      providerOrSigner: admin,
    });

    expect(appToBeneficiaryFlow.flowRate).to.equal(
      expectedAmount,
      "App -> Beneficiary flow is incorrect"
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

  async function checkCurrentOwnerBid(
    licenseId: number,
    expectedAmount: number
  ) {
    const currentOwnerBid = await superApp.currentOwnerBid(licenseId);
    await expect(currentOwnerBid[2]).to.equal(expectedAmount);
  }

  async function checkOutstandingBid(
    licenseId: number,
    expectedAmount: number
  ) {
    const outstandingBid = await superApp.outstandingBid(licenseId);
    await expect(outstandingBid[2]).to.equal(expectedAmount);
  }

  async function checkOldBid(
    user: SignerWithAddress,
    licenseId: number,
    expectedAmount: number
  ) {
    const oldBid = await superApp.oldBids(user.address, licenseId);
    await expect(oldBid[2]).to.equal(expectedAmount);
  }

  async function checkOwnerBidContributionRate(
    licenseId: number,
    expectedAmount: number
  ) {
    const contribution = await superApp.ownerBidContributionRate(licenseId);
    await expect(contribution).to.equal(expectedAmount);
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

  after(async () => {
    await network.provider.send("hardhat_reset");
  });

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

    mockLicense = await smock.fake<ERC721License>("ERC721License");

    const mockClaimerFactory = new MockClaimer__factory(admin);
    mockClaimer = await mockClaimerFactory.deploy();
    await mockClaimer.deployed();

    mockReclaimer = await smock.fake<IClaimer>("IClaimer");

    superApp = await buildAuctionSuperApp({
      host: sf.host.address,
      cfa: sf.agreements.cfa.address,
      token: sf.tokens.ETHx.address,
      beneficiary: admin.address,
      claimer: mockClaimer.address,
      reclaimer: mockReclaimer.address,
      license: mockLicense.address,
      perSecondFeeNumerator: BigNumber.from(numerator),
      perSecondFeeDenominator: BigNumber.from(denominator),
      penaltyNumerator: BigNumber.from(1),
      penaltyDenominator: BigNumber.from(10),
      bidPeriodLengthInSeconds: BigNumber.from(604800),
    });
  });

  it("should fail to deploy if host is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        ethers.constants.AddressZero,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        admin.address,
        mockLicense.address,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("host is zero address");
  });

  it("should fail to deploy if cfa is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        ethers.constants.AddressZero,
        sf.tokens.ETHx.address,
        admin.address,
        mockLicense.address,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("cfa is zero address");
  });

  it("should fail to deploy if acceptedToken is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        ethers.constants.AddressZero,
        admin.address,
        mockLicense.address,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("acceptedToken is zero address");
  });

  it("should fail to deploy if beneficiary is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        ethers.constants.AddressZero,
        mockLicense.address,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("beneficiary is zero address");
  });

  it("should fail to deploy if license is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        admin.address,
        ethers.constants.AddressZero,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("license is zero address");
  });

  it("should fail to deploy if claimer is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        admin.address,
        mockLicense.address,
        ethers.constants.AddressZero,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("claimer is zero address");
  });

  it("should fail to deploy if reclaimer is zero", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        admin.address,
        mockLicense.address,
        mockLicense.address,
        ethers.constants.AddressZero,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("reclaimer is zero address");
  });

  it("should fail to deploy if beneficiary is an app", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    expect(
      factory.deploy(
        sf.host.address,
        sf.agreements.cfa.address,
        sf.tokens.ETHx.address,
        superApp.address,
        mockLicense.address,
        mockLicense.address,
        mockLicense.address,
        BigNumber.from(numerator),
        BigNumber.from(denominator),
        BigNumber.from(1),
        BigNumber.from(10),
        BigNumber.from(604800)
      )
    ).to.be.revertedWith("beneficiary is an app");
  });

  it("should not allow beneficiary to be an app", async () => {
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
    const factory = new AuctionSuperApp__factory(admin);
    const superApp1 = await factory.deploy(
      sf.host.address,
      sf.agreements.cfa.address,
      sf.tokens.ETHx.address,
      admin.address,
      mockLicense.address,
      mockLicense.address,
      mockLicense.address,
      BigNumber.from(numerator),
      BigNumber.from(denominator),
      BigNumber.from(1),
      BigNumber.from(10),
      BigNumber.from(604800)
    );
    await superApp1.deployed();

    expect(
      superApp.connect(admin).setBeneficiary(superApp1.address)
    ).to.be.revertedWith("beneficiary is an app");
  });

  it("should only allow admin to set beneficiary", async () => {
    expect(
      superApp.connect(user).setBeneficiary(admin.address)
    ).to.be.revertedWith("is missing role");

    await superApp.setBeneficiary(admin.address);

    const value = await superApp.beneficiary();
    expect(value).to.equal(admin.address);
  });

  it("should move flow to new beneficiary", async () => {
    const txn = await claimCreate(user);
    await txn.wait();

    await superApp.setBeneficiary(other.address);

    const value = await superApp.beneficiary();
    expect(value).to.equal(other.address);
    await checkAppToUserFlow("0", admin);
    await checkAppToUserFlow("100", other);
    await checkAppNetFlow();
  });

  it("should only allow PAUSE_ROLE to pause and unpause", async () => {
    expect(superApp.connect(user).pause()).to.be.revertedWith(
      "is missing role"
    );

    await superApp.pause();

    expect(superApp.connect(user).unpause()).to.be.revertedWith(
      "is missing role"
    );

    await superApp.unpause();
  });

  it("should only allow admin to set claimer", async () => {
    expect(superApp.connect(user).setClaimer(admin.address)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setClaimer(admin.address);

    const value = await superApp.claimer();
    expect(value).to.equal(admin.address);
  });

  it("should only allow admin to set fee", async () => {
    expect(superApp.connect(user).setPerSecondFee(1, 2)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setPerSecondFee(1, 2);

    const numerator = await superApp.perSecondFeeNumerator();
    const denominator = await superApp.perSecondFeeDenominator();

    expect(numerator).to.equal(1);
    expect(denominator).to.equal(2);
  });

  it("should only allow admin to set penalty", async () => {
    expect(superApp.connect(user).setPenalty(1, 2)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setPenalty(1, 2);

    const numerator = await superApp.penaltyNumerator();
    const denominator = await superApp.penaltyDenominator();

    expect(numerator).to.equal(1);
    expect(denominator).to.equal(2);
  });

  it("should only allow admin to set license", async () => {
    expect(superApp.connect(user).setLicense(admin.address)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setLicense(admin.address);

    const value = await superApp.license();
    expect(value).to.equal(admin.address);
  });

  it("should only allow admin to set claimer", async () => {
    expect(superApp.connect(user).setClaimer(admin.address)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setClaimer(admin.address);

    const value = await superApp.claimer();
    expect(value).to.equal(admin.address);
  });

  it("should only allow admin to set bid period", async () => {
    expect(superApp.connect(user).setBidPeriod(100)).to.be.revertedWith(
      "is missing role"
    );

    await superApp.setBidPeriod(100);

    const value = await superApp.bidPeriodLengthInSeconds();
    expect(value).to.equal(100);
  });

  xdescribe("No user data", async () => {
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      await checkAppToBeneficiaryFlow("0");
      await checkAppNetFlow();
      await expect(txn1)
        .to.emit(superApp, "UserDeleted")
        .withArgs(user.address);
    });

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimCreate(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, existingLicenseId);
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

  xdescribe("Unknown Action", async () => {
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      await checkAppToBeneficiaryFlow("0");
      await checkAppNetFlow();
      await expect(txn1)
        .to.emit(superApp, "UserDeleted")
        .withArgs(user.address);
    });

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimCreate(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, existingLicenseId);
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

  xdescribe("Random user data", async () => {
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      const txn = await claimCreate(user);
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
      await checkAppToBeneficiaryFlow("0");
      await checkAppNetFlow();
      await expect(txn1)
        .to.emit(superApp, "UserDeleted")
        .withArgs(user.address);
    });

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimCreate(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, existingLicenseId);
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

  xdescribe("CLAIM Action", async () => {
    it("should claim on flow create", async () => {
      const txn = await claimCreate(user);
      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const receipt = await txn.wait();

      await checkJailed(receipt);
      await checkClaimCallCount(1);
      await checkClaimLastContribution(user.address, 100);
      await checkAppNetFlow();
      await checkUserToAppFlow("100");
      await checkAppToBeneficiaryFlow("100");
      await expect(txn)
        .to.emit(superApp, "ParcelClaimed")
        .withArgs(1, user.address, BigNumber.from(100));
    });

    it("should claim on flow create with rounded for sale price", async () => {
      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.0");

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: "1000",
      });

      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = await batchCall.exec(user);

      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const receipt = await txn.wait();

      await checkJailed(receipt);
      await checkClaimCallCount(1);
      await checkClaimLastContribution(
        user.address,
        contributionRate.toNumber()
      );
      await checkAppNetFlow();
      await checkUserToAppFlow(contributionRate.toString());
      await checkAppToBeneficiaryFlow(contributionRate.toString());
      await expect(txn)
        .to.emit(superApp, "ParcelClaimed")
        .withArgs(1, user.address, BigNumber.from(100));
    });

    it("should revert on flow create with incorrectly rounded for sale price", async () => {
      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.1");

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: "1000",
      });

      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = batchCall.exec(user);

      await expect(txn).to.be.rejected;
    });

    it("should claim on flow create with rounded for sale price", async () => {
      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.0");

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: "1000",
      });

      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = await batchCall.exec(user);

      await expect(txn)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(user.address, admin.address, 100);

      const receipt = await txn.wait();

      await checkJailed(receipt);
      await checkClaimCallCount(1);
      await checkClaimLastContribution(
        user.address,
        contributionRate.toNumber()
      );
      await checkAppNetFlow();
      await checkUserToAppFlow(contributionRate.toString());
      await checkAppToBeneficiaryFlow(contributionRate.toString());
    });

    it("should revert on flow create with incorrectly rounded for sale price", async () => {
      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.1");

      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: "1000",
      });

      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const createFlowOp = await ethersjsSf.cfaV1.createFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });

      const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
      const txn = batchCall.exec(user);

      await expect(txn).to.be.rejected;
    });

    it("should claim on flow increase", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [await rateToPurchasePrice(BigNumber.from(200)), claimData]
      );
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
      await checkAppToBeneficiaryFlow("300");
      await expect(txn)
        .to.emit(superApp, "ParcelClaimed")
        .withArgs(1, user.address, BigNumber.from(100));
    });

    it("should claim on flow increase with rounded for sale price", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.0");

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.add(100).toString(),
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
      await checkClaimLastContribution(
        user.address,
        contributionRate.toNumber()
      );
      await checkAppNetFlow();
      await checkUserToAppFlow(contributionRate.add(100).toString());
      await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
      await expect(txn)
        .to.emit(superApp, "ParcelClaimed")
        .withArgs(1, user.address, BigNumber.from(100));
    });

    it("should revert on flow increase with incorrectly rounded for sale price", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.1");

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });
      const txn1 = updateFlowOp.exec(user);

      await expect(txn1).to.be.rejected;
    });

    it("should claim on flow increase with rounded for sale price", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.0");

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.add(100).toString(),
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
      await checkClaimLastContribution(
        user.address,
        contributionRate.toNumber()
      );
      await checkAppNetFlow();
      await checkUserToAppFlow(contributionRate.add(100).toString());
      await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
    });

    it("should revert on flow increase with incorrectly rounded for sale price", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      const contributionRate = BigNumber.from(3170979198);
      const forSalePrice = ethers.utils.parseEther("1.1");

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [forSalePrice, claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
      );
      const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
        sender: user.address,
        receiver: superApp.address,
        flowRate: contributionRate.toString(),
        superToken: ethx.address,
        userData: userData,
      });
      const txn1 = updateFlowOp.exec(user);

      await expect(txn1).to.be.rejected;
    });

    it("should revert on flow decrease", async () => {
      const txn = await claimCreate(user);
      await txn.wait();

      // Update existing flow
      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [await rateToPurchasePrice(BigNumber.from(200)), claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
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
      const txn = await claimCreate(user);
      await txn.wait();

      const claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [await rateToPurchasePrice(BigNumber.from(200)), claimData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.CLAIM, actionData]
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
      await checkAppToBeneficiaryFlow("0");
      await checkAppNetFlow();
      await expect(txn1)
        .to.emit(superApp, "UserDeleted")
        .withArgs(user.address);
    });

    it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
      let existingLicenseId = 1;
      const txn = await claimCreate(user, existingLicenseId);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, existingLicenseId);
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

  describe("BID Action", async () => {
    xdescribe("New highest bidder", async () => {
      it("should place bid on flow create", async () => {
        let existingLicenseId = 1;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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

        await expect(txn1)
          .to.emit(superApp, "BidPlaced")
          .withArgs(existingLicenseId, user.address, bidder.address);

        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("200", bidder);
        await checkAppToUserFlow("200", bidder);
        await checkUserToAppFlow("100", user);
        await checkAppToBeneficiaryFlow("100");
      });

      it("should place bid on flow create with rounded for sale price", async () => {
        let existingLicenseId = 1;
        const txn = await claimMediumCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeLargeBidCreate(bidder, existingLicenseId);
        const receipt = await txn1.wait();

        const contributionRate = BigNumber.from(317097919);
        const contributionRate1 = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("0.1");

        await expect(txn1)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, superApp.address, forSalePrice);

        await expect(txn1)
          .to.emit(superApp, "BidPlaced")
          .withArgs(existingLicenseId, user.address, bidder.address);

        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow(contributionRate1.toString(), bidder);
        await checkAppToUserFlow(contributionRate1.toString(), bidder);
        await checkUserToAppFlow(contributionRate.toString(), user);
        await checkAppToBeneficiaryFlow(contributionRate.toString());
      });

      it("should revert on flow create with incorrect rounded for sale price", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("0.9");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
        const txn1 = batchCall.exec(bidder);
        await expect(txn1).to.be.rejected;
      });

      it("should place bid on flow increase", async () => {
        let existingLicenseId = 1;

        // User 1 claim
        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        // User 2 claim
        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        await expect(txn2)
          .to.emit(superApp, "BidPlaced")
          .withArgs(existingLicenseId, user.address, bidder.address);
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("300", bidder);
        await checkAppToUserFlow("200", bidder);
        await checkUserToAppFlow("100", user);
        await checkAppToBeneficiaryFlow("200");
      });

      it("should place bid on flow increase with rounded for sale price", async () => {
        let existingLicenseId = 1;

        // User 1 claim
        const contributionRate = BigNumber.from(317097919);
        const txn = await claimMediumCreate(user, existingLicenseId);
        await txn.wait();
        const forSalePrice = ethers.utils.parseEther("0.1");

        // User 2 claim
        const contributionRate1 = BigNumber.from(3170979198);
        const forSalePrice1 = ethers.utils.parseEther("1.0");

        const approveOp1 = ethx.approve({
          receiver: superApp.address,
          amount: forSalePrice.toString(),
        });

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const bidData1 = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData1 = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice1, bidData1]
        );
        const userData1 = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData1]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate1.add(100).toString(),
          superToken: ethx.address,
          userData: userData1,
        });

        const batchCall1 = ethersjsSf.batchCall([approveOp1, updateFlowOp]);
        const txn2 = await batchCall1.exec(bidder);
        const receipt = await txn2.wait();

        await expect(txn2)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, superApp.address, forSalePrice);
        await expect(txn2)
          .to.emit(superApp, "BidPlaced")
          .withArgs(existingLicenseId, user.address, bidder.address);
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow(contributionRate1.add(100).toString(), bidder);
        await checkAppToUserFlow(contributionRate1.toString(), bidder);
        await checkUserToAppFlow(contributionRate.toString(), user);
        await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
      });

      it("should revert on flow increase with incorrect rounded for sale price", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.1");

        // User 1 claim
        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        // User 2 claim
        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn2 = batchCall.exec(bidder);
        await expect(txn2).to.be.rejected;
      });

      it("should revert on flow create when license does not exist", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.0");

        // User 1 claim
        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        // User 2 claim
        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
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
        await checkUserToAppFlow(contributionRate.add(100).toString(), bidder);
        await checkAppToUserFlow(contributionRate.toString(), bidder);
        await checkUserToAppFlow("100", user);
        await checkAppToBeneficiaryFlow("200");
      });

      it("should revert on flow increase with incorrect rounded for sale price", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.1");

        // User 1 claim
        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        // User 2 claim
        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn2 = batchCall.exec(bidder);
        await expect(txn2).to.be.rejected;
      });

      it("should revert on flow increase when license does not exist", async () => {
        let existingLicenseId = 1;

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));
        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn2 = batchCall.exec(bidder);
        await expect(txn2).to.be.rejected;
      });

      it("should revert on flow create when outstanding bid exists", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(300)), bidData]
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
        const txn2 = batchCall.exec(other);
        await expect(txn2).to.be.rejected;
      });

      it("should revert on flow increase when outstanding bid exists", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const txn2 = await claimCreate(other, 1);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn3 = batchCall.exec(other);
        await expect(txn3).to.be.rejected;
      });

      it("should revert on flow increase after owner deleted bid when outstanding bid exists", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const txn2 = await claimCreate(other, 1);
        await txn2.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn3 = await deleteFlowOp.exec(user);
        await txn3.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn4 = batchCall.exec(other);
        await expect(txn4).to.be.rejected;
      });

      it("should revert on flow create when bid is not high enough", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(100)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: bidder.address,
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

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 1);
        await txn1.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(100)), bidData]
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
        const txn2 = batchCall.exec(bidder);
        await expect(txn2).to.be.rejected;
      });

      it("should reclaim on flow create after owner deleted bid", async () => {
        let existingLicenseId = 1;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn3 = await batchCall.exec(bidder);
        const receipt = await txn3.wait();

        mockLicense.ownerOf
          .whenCalledWith(existingLicenseId)
          .returns(bidder.address);

        await expect(txn3)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, user.address, purchasePrice);
        await expect(txn3)
          .to.emit(superApp, "ParcelReclaimed")
          .withArgs(existingLicenseId, bidder.address, purchasePrice);

        await checkJailed(receipt);
        await checkUserToAppFlow("200", bidder);
        await checkAppToUserFlow("0", bidder);
        await checkUserToAppFlow("0", user);
        await checkAppToBeneficiaryFlow("200");
        await checkCurrentOwnerBid(existingLicenseId, 200);
        await checkOwnerBidContributionRate(existingLicenseId, 200);
        await checkOutstandingBid(existingLicenseId, 0);
        await checkAppNetFlow();

        expect(
          mockReclaimer.claim
        ).to.have.been.calledWith(
          bidder.address,
          BigNumber.from("200"),
          bidData
        );
      });

      it("should reclaim on flow create with rounded for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.0");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
        const txn3 = await batchCall.exec(bidder);
        const receipt = await txn3.wait();

        mockLicense.ownerOf
          .whenCalledWith(existingLicenseId)
          .returns(bidder.address);

        await expect(txn3)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, user.address, purchasePrice);

        await checkJailed(receipt);
        await checkUserToAppFlow(contributionRate.toString(), bidder);
        await checkAppToUserFlow("0", bidder);
        await checkUserToAppFlow("0", user);
        await checkAppToBeneficiaryFlow(contributionRate.toString());
        await checkCurrentOwnerBid(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOwnerBidContributionRate(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOutstandingBid(existingLicenseId, 0);
        await checkAppNetFlow();

        expect(
          mockReclaimer.claim
        ).to.have.been.calledWith(
          bidder.address,
          contributionRate,
          bidData
        );
      });

      it("should revert on flow create with incorrect for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.1");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
        const txn3 = batchCall.exec(bidder);
        await expect(txn3).to.be.rejected;
      });

      it("should reclaim on flow increase after owner deleted bid", async () => {
        let existingLicenseId = 1;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn3 = await batchCall.exec(bidder);
        const receipt = await txn3.wait();

        mockLicense.ownerOf
          .whenCalledWith(existingLicenseId)
          .returns(bidder.address);

        await expect(txn3)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, user.address, purchasePrice);
        await expect(txn3)
          .to.emit(superApp, "ParcelReclaimed")
          .withArgs(existingLicenseId, bidder.address, purchasePrice);

        await checkJailed(receipt);
        await checkUserToAppFlow("300", bidder);
        await checkAppToUserFlow("0", bidder);
        await checkUserToAppFlow("0", user);
        await checkAppToBeneficiaryFlow("300");
        await checkCurrentOwnerBid(existingLicenseId, 200);
        await checkOwnerBidContributionRate(existingLicenseId, 200);
        await checkOutstandingBid(existingLicenseId, 0);
        await checkAppNetFlow();

        expect(
          mockReclaimer.claim
        ).to.have.been.calledWith(
          bidder.address,
          BigNumber.from("200"),
          bidData
        );
      });

      it("should reclaim on flow increase with rounded for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.0");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn3 = await batchCall.exec(bidder);
        const receipt = await txn3.wait();

        mockLicense.ownerOf
          .whenCalledWith(existingLicenseId)
          .returns(bidder.address);

        await expect(txn3)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, user.address, purchasePrice);
        await expect(txn3)
          .to.emit(superApp, "ParcelReclaimed")
          .withArgs(existingLicenseId, bidder.address, purchasePrice);

        await checkJailed(receipt);
        await checkUserToAppFlow(contributionRate.add(100).toString(), bidder);
        await checkAppToUserFlow("0", bidder);
        await checkUserToAppFlow("0", user);
        await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
        await checkCurrentOwnerBid(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOwnerBidContributionRate(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOutstandingBid(existingLicenseId, 0);
        await checkAppNetFlow();

        expect(
          mockLicense["safeTransferFrom(address,address,uint256)"]
        ).to.have.been.calledWith(
          user.address,
          bidder.address,
          BigNumber.from(existingLicenseId)
        );
      });

      it("should revert on flow increase with rounded for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.1");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn3 = batchCall.exec(bidder);
        await expect(txn3).to.be.rejected;
      });

      it("should reclaim on flow increase with rounded for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.0");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn3 = await batchCall.exec(bidder);
        const receipt = await txn3.wait();

        mockLicense.ownerOf
          .whenCalledWith(existingLicenseId)
          .returns(bidder.address);

        await expect(txn3)
          .to.emit(ethx_erc20, "Transfer")
          .withArgs(bidder.address, user.address, purchasePrice);

        await checkJailed(receipt);
        await checkUserToAppFlow(contributionRate.add(100).toString(), bidder);
        await checkAppToUserFlow("0", bidder);
        await checkUserToAppFlow("0", user);
        await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
        await checkCurrentOwnerBid(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOwnerBidContributionRate(
          existingLicenseId,
          contributionRate.toNumber()
        );
        await checkOutstandingBid(existingLicenseId, 0);
        await checkAppNetFlow();

        expect(
          mockReclaimer.claim
        ).to.have.been.calledWith(
          bidder.address,
          contributionRate,
          bidData
        );
      });

      it("should revert on flow increase with rounded for sale price after owner deleted bid", async () => {
        let existingLicenseId = 1;
        const contributionRate = BigNumber.from(3170979198);
        const forSalePrice = ethers.utils.parseEther("1.1");

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: user.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(user);
        await txn2.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        mockReclaimer.claimPrice.returns(purchasePrice);
        mockReclaimer.claim.returns(existingLicenseId);

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [forSalePrice, bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: contributionRate.add(100).toString(),
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn3 = batchCall.exec(bidder);
        await expect(txn3).to.be.rejected;
      });
    });

    xdescribe("Outstanding bidder", async () => {
      it("should recreate Flow(app -> user) on delete Flow(app -> user)", async () => {
        let existingLicenseId = 1;
        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
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

      it("should revert on flow create on second bid", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(300)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const createFlowOp = await ethersjsSf.cfaV1.createFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: "300",
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);
        const txn2 = batchCall.exec(bidder);
        await expect(txn2).to.be.rejected;
      });

      it("should revert on flow increase on second bid", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(200)), bidData]
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
        const txn3 = batchCall.exec(bidder);
        await expect(txn3).to.be.rejected;
      });

      it("should revert on flow decrease on second bid", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const purchasePrice = await rateToPurchasePrice(BigNumber.from("100"));

        const approveOp = ethx.approve({
          receiver: superApp.address,
          amount: purchasePrice.toString(),
        });

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(150)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          sender: bidder.address,
          receiver: superApp.address,
          flowRate: "150",
          superToken: ethx.address,
          userData: userData,
        });

        const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);
        const txn3 = batchCall.exec(bidder);
        await expect(txn3).to.be.rejected;
      });

      it("should not delete bid on flow delete", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: bidder.address,
          receiver: superApp.address,
          superToken: ethx.address,
        });

        const txn2 = await deleteFlowOp.exec(bidder);
        const receipt = await txn2.wait();

        await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("100", user);
        await checkUserToAppFlow("0", bidder);
        await checkAppToUserFlow("0", bidder);
        await checkAppToBeneficiaryFlow("100");
        await checkCurrentOwnerBid(existingLicenseId, 100);
        await checkOwnerBidContributionRate(existingLicenseId, 100);
        await checkOutstandingBid(existingLicenseId, 200);
      });
    });

    describe("Current owner", async () => {
      xdescribe("No outstanding bid", async () => {
        it("should increase bid on flow increase", async () => {
          let existingLicenseId = 1;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(200)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "200",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(existingLicenseId, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", user);
          await checkAppToBeneficiaryFlow("200");
          await checkCurrentOwnerBid(existingLicenseId, 200);
          await checkOwnerBidContributionRate(existingLicenseId, 200);
        });

        it("should increase bid on flow increase with rounded for sale price", async () => {
          let existingLicenseId = 1;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.0");

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(existingLicenseId, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow(contributionRate.toString(), user);
          await checkAppToBeneficiaryFlow(contributionRate.toString());
          await checkCurrentOwnerBid(
            existingLicenseId,
            contributionRate.toNumber()
          );
          await checkOwnerBidContributionRate(
            existingLicenseId,
            contributionRate.toNumber()
          );
        });

        it("should revert on flow increase with incorrect for sale price", async () => {
          let existingLicenseId = 1;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.1");

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = updateFlowOp.exec(user);
          await expect(txn2).to.be.rejected;
        });

        it("should decrease bid on flow decrease", async () => {
          let existingLicenseId = 1;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(50)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "50",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(existingLicenseId, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("50", user);
          await checkAppToBeneficiaryFlow("50");
          await checkCurrentOwnerBid(existingLicenseId, 50);
          await checkOwnerBidContributionRate(existingLicenseId, 50);
        });

        it("should decrease bid on flow decrease with rounded for sale price", async () => {
          let existingLicenseId = 1;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.0");

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: "1000",
          });

          const claimData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, claimData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.CLAIM, actionData]
          );
          const createFlowOp = await ethersjsSf.cfaV1.createFlow({
            sender: user.address,
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });

          const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);

          const txn = await batchCall.exec(user);
          await txn.wait();

          mockLicense.ownerOf
            .whenCalledWith(existingLicenseId)
            .returns(user.address);

          const contributionRate1 = BigNumber.from(317097919);
          const forSalePrice1 = ethers.utils.parseEther("0.1");

          const bidData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice1, bidData1]
          );
          const userData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData1]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate1.toString(),
            superToken: ethx.address,
            userData: userData1,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(existingLicenseId, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow(contributionRate1.toString(), user);
          await checkAppToBeneficiaryFlow(contributionRate1.toString());
          await checkCurrentOwnerBid(
            existingLicenseId,
            contributionRate1.toNumber()
          );
          await checkOwnerBidContributionRate(
            existingLicenseId,
            contributionRate1.toNumber()
          );
        });

        it("should revert on flow decrease with incorrect for sale price", async () => {
          let existingLicenseId = 1;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.0");

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: "1000",
          });

          const claimData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, claimData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.CLAIM, actionData]
          );
          const createFlowOp = await ethersjsSf.cfaV1.createFlow({
            sender: user.address,
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });

          const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);

          const txn = await batchCall.exec(user);
          await txn.wait();

          mockLicense.ownerOf
            .whenCalledWith(existingLicenseId)
            .returns(user.address);

          const contributionRate1 = BigNumber.from(317097919);
          const forSalePrice1 = ethers.utils.parseEther("0.11");

          const bidData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice1, bidData1]
          );
          const userData1 = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData1]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate1.toString(),
            superToken: ethx.address,
            userData: userData1,
          });

          const txn2 = updateFlowOp.exec(user);
          await expect(txn2).to.be.rejected;
        });

        it("should decrease bid on flow decrease and multiple bids", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(50)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "150",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(2, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("150", user);
          await checkAppToBeneficiaryFlow("150");
          await checkCurrentOwnerBid(1, 100);
          await checkOwnerBidContributionRate(1, 100);
          await checkCurrentOwnerBid(2, 50);
          await checkOwnerBidContributionRate(2, 50);
        });

        it("should delete bid on flow decrease and multiple bids", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(0)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "100",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(2, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("100", user);
          await checkAppToBeneficiaryFlow("100");
          await checkCurrentOwnerBid(1, 100);
          await checkOwnerBidContributionRate(1, 100);
          await checkCurrentOwnerBid(2, 0);
          await checkOwnerBidContributionRate(2, 0);
        });

        it("should delete all bids on flow delete and multiple bids", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn2 = await deleteFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "UserDeleted")
            .withArgs(user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("0", user);
          await checkAppToBeneficiaryFlow("0");
          await checkOwnerBidContributionRate(1, 0);
          await checkOwnerBidContributionRate(2, 0);
        });

        it("should delete bid on flow delete and single bid", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn2 = await deleteFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "UserDeleted")
            .withArgs(user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("0", user);
          await checkAppToBeneficiaryFlow("0");
          await checkOwnerBidContributionRate(1, 0);
        });

        it("should increase bid on flow increase after deleted bid", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn1 = await deleteFlowOp.exec(user);
          await txn1.wait();

          const txn2 = await placeBidCreate(user, 1);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(1, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", user);
          await checkAppToBeneficiaryFlow("200");
          await checkCurrentOwnerBid(1, 200);
          await checkOwnerBidContributionRate(1, 200);
        });

        it("should increase bid on flow increase after multiple deleted bids", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn2 = await deleteFlowOp.exec(user);
          await txn2.wait();

          const txn3 = await placeBidCreate(user, 1);
          await txn3.wait();

          const txn4 = await placeBidUpdate(user, 2);
          const receipt = await txn4.wait();

          await expect(txn4).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn4)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(2, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("400", user);
          await checkAppToBeneficiaryFlow("400");
          await checkCurrentOwnerBid(2, 200);
          await checkOwnerBidContributionRate(2, 200);
        });

        it("should increase bid twice after deleted bid", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn1 = await deleteFlowOp.exec(user);
          await txn1.wait();

          const txn2 = await placeBidCreate(user, 1);
          await txn2.wait();

          const txn3 = await placeBidUpdate(user, 1);
          const receipt = await txn3.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await expect(txn2)
            .to.emit(superApp, "OwnerBidUpdated")
            .withArgs(1, user.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("400", user);
          await checkAppToBeneficiaryFlow("400");
          await checkCurrentOwnerBid(1, 400);
          await checkOwnerBidContributionRate(1, 400);
        });

        it("should revert on flow decrease of more than contribution", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [2]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(0)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "50",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = updateFlowOp.exec(user);
          await expect(txn2).to.be.rejected;
        });
      });

      describe("Outstanding bid has not elapsed", async () => {
        it("should pay penalty and increase bid on flow increase", async () => {
          let existingLicenseId = 2;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          const newForSalePrice = await rateToPurchasePrice(
            BigNumber.from(200)
          );
          const penaltyAmount = await calculatePenaltyAmount(newForSalePrice);

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: penaltyAmount.toString(),
          });

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [newForSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "200",
            superToken: ethx.address,
            userData: userData,
          });
          const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);

          const txn2 = await batchCall.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2)
            .to.emit(ethx_erc20, "Transfer")
            .withArgs(user.address, admin.address, penaltyAmount);
          await expect(txn2)
            .to.emit(superApp, "BidRejected")
            .withArgs(existingLicenseId, user.address, bidder.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow("200", user);
          await checkAppToBeneficiaryFlow("200");
          await checkCurrentOwnerBid(existingLicenseId, 200);
          await checkOwnerBidContributionRate(existingLicenseId, 200);
          await checkOutstandingBid(existingLicenseId, 0);
          await checkOldBid(bidder, existingLicenseId, 200);
        });

        it("should pay penalty and increase bid on flow increase with rounded for sale price", async () => {
          let existingLicenseId = 2;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.0");

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          const newForSalePrice = await rateToPurchasePrice(
            BigNumber.from(200)
          );
          const penaltyAmount = await calculatePenaltyAmount(newForSalePrice);

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: penaltyAmount.toString(),
          });

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });
          const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);

          const txn2 = await batchCall.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2)
            .to.emit(ethx_erc20, "Transfer")
            .withArgs(user.address, admin.address, penaltyAmount);
          await expect(txn2)
            .to.emit(superApp, "BidRejected")
            .withArgs(existingLicenseId, user.address, bidder.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow(contributionRate.toString(), user);
          await checkAppToBeneficiaryFlow(contributionRate.toString());
          await checkCurrentOwnerBid(
            existingLicenseId,
            contributionRate.toNumber()
          );
          await checkOwnerBidContributionRate(
            existingLicenseId,
            contributionRate.toNumber()
          );
          await checkOutstandingBid(existingLicenseId, 0);
          await checkOldBid(bidder, existingLicenseId, 200);
        });

        it("should revert on flow increase with rounded for sale price", async () => {
          let existingLicenseId = 2;
          const contributionRate = BigNumber.from(3170979198);
          const forSalePrice = ethers.utils.parseEther("1.1");

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          const purchasePrice = await rateToPurchasePrice(BigNumber.from(100));
          const penaltyAmount = await calculatePenaltyAmount(purchasePrice);

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: penaltyAmount.toString(),
          });

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [forSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: contributionRate.toString(),
            superToken: ethx.address,
            userData: userData,
          });
          const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);

          const txn2 = batchCall.exec(user);
          await expect(txn2).to.be.rejected;
        });

        it("should not clear outstanding bid if flow increase is not high enough", async () => {
          let existingLicenseId = 2;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(150)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "150",
            superToken: ethx.address,
            userData: userData,
          });

          const txn2 = await updateFlowOp.exec(user);
          const receipt = await txn2.wait();

          await expect(txn2).to.not.emit(ethx_erc20, "Transfer");
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow("150", user);
          await checkAppToBeneficiaryFlow("150");
          await checkCurrentOwnerBid(existingLicenseId, 150);
          await checkOwnerBidContributionRate(existingLicenseId, 150);
          await checkOutstandingBid(existingLicenseId, 200);
        });

        it("should revert if penalty is not approved on flow increase", async () => {
          let existingLicenseId = 2;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(200)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "200",
            superToken: ethx.address,
            userData: userData,
          });
          const txn2 = updateFlowOp.exec(user);
          await expect(txn2).to.be.rejected;
        });

        it("should accept bid on flow decrease", async () => {
          const forSalePrice = ethers.utils.parseEther("0.1");
          const txn = await claimMediumCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2);
          await txn1.wait();

          const contributionRate = BigNumber.from(3170979198);
          const txn2 = await placeLargeBidCreate(bidder, 1);
          await txn2.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(0)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "100",
            superToken: ethx.address,
            userData: userData,
          });

          const txn3 = await updateFlowOp.exec(user);
          const receipt = await txn3.wait();

          await expect(txn3)
            .to.emit(ethx_erc20, "Transfer")
            .withArgs(superApp.address, user.address, forSalePrice);
          await expect(txn3)
            .to.emit(superApp, "BidAccepted")
            .withArgs(1, user.address, bidder.address, forSalePrice);
          await checkJailed(receipt);
          await checkUserToAppFlow(contributionRate.toString(), bidder);
          await checkAppToUserFlow("0", bidder);
          await checkUserToAppFlow("100", user);
          await checkAppToUserFlow("0", user);
          await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
          await checkCurrentOwnerBid(1, contributionRate.toNumber());
          await checkOwnerBidContributionRate(1, contributionRate.toNumber());
          await checkOutstandingBid(1, 0);
          await checkCurrentOwnerBid(2, 100);
          await checkOwnerBidContributionRate(2, 100);
          await checkOutstandingBid(2, 0);
          await checkAppNetFlow();
          expect(
            mockLicense["safeTransferFrom(address,address,uint256)"]
          ).to.have.been.calledWith(
            user.address,
            bidder.address,
            BigNumber.from(1)
          );
        });

        it("should revert when accepting wrong bid amount on flow decrease", async () => {
          const txn = await claimCreate(user, 1); // 100
          await txn.wait();

          const txn1 = await claimUpdate(user, 2); // 100
          await txn1.wait();

          const txn2 = await placeBidCreate(bidder, 1); // 200
          await txn2.wait();

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(50)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );

          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "150",
            superToken: ethx.address,
            userData: userData,
          });

          const txn3 = updateFlowOp.exec(user);
          await expect(txn3).to.be.rejected;
        });

        it("should keep outstanding bid open on owner flow delete", async () => {
          const txn = await claimCreate(user, 1); // 100
          await txn.wait();

          const txn2 = await placeBidCreate(bidder, 1); // 200
          await txn2.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn3 = await deleteFlowOp.exec(user);
          const receipt = await txn3.wait();

          await expect(txn3).to.not.emit(ethx_erc20, "Transfer");
          await checkJailed(receipt);
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow("0", user);
          await checkAppToUserFlow("0", user);
          await checkAppToBeneficiaryFlow("0");
          await checkCurrentOwnerBid(1, 100);
          await checkOwnerBidContributionRate(1, 0);
          await checkOutstandingBid(1, 200);
          await checkAppNetFlow();
          expect(mockLicense["safeTransferFrom(address,address,uint256)"]).to
            .not.have.been.called;
        });

        it("should pay penalty on flow increase after deleted bid", async () => {
          const txn = await claimCreate(user, 1);
          await txn.wait();

          const txn2 = await placeBidCreate(bidder, 1); // 200
          await txn2.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn3 = await deleteFlowOp.exec(user);
          await txn3.wait();

          const newForSalePrice = await rateToPurchasePrice(
            BigNumber.from(200)
          );
          const penaltyAmount = await calculatePenaltyAmount(newForSalePrice);

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: penaltyAmount.toString(),
          });

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [newForSalePrice, bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const createFlowOp = await ethersjsSf.cfaV1.createFlow({
            receiver: superApp.address,
            flowRate: "200",
            superToken: ethx.address,
            userData: userData,
          });
          const batchCall = ethersjsSf.batchCall([approveOp, createFlowOp]);

          const txn4 = await batchCall.exec(user);
          const receipt = await txn4.wait();

          await expect(txn4)
            .to.emit(ethx_erc20, "Transfer")
            .withArgs(user.address, admin.address, penaltyAmount);
          await expect(txn4)
            .to.emit(superApp, "BidRejected")
            .withArgs(1, user.address, bidder.address);
          await checkJailed(receipt);
          await checkAppNetFlow();
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow("200", user);
          await checkAppToBeneficiaryFlow("200");
          await checkCurrentOwnerBid(1, 200);
          await checkOwnerBidContributionRate(1, 200);
          await checkOutstandingBid(1, 0);
          await checkOldBid(bidder, 1, 200);
        });
      });

      describe("Outstanding bid has elapsed", async () => {
        it("should revert on flow increase", async () => {
          let existingLicenseId = 2;

          const txn = await claimCreate(user, existingLicenseId);
          await txn.wait();

          const txn1 = await placeBidCreate(bidder, existingLicenseId);
          await txn1.wait();

          // Advance time
          await network.provider.send("evm_increaseTime", [700000]);
          await network.provider.send("evm_mine");

          const purchasePrice = await rateToPurchasePrice(BigNumber.from(100));
          const penaltyAmount = await calculatePenaltyAmount(purchasePrice);

          const approveOp = ethx.approve({
            receiver: superApp.address,
            amount: penaltyAmount.toString(),
          });

          const bidData = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [existingLicenseId]
          );
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(200)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "200",
            superToken: ethx.address,
            userData: userData,
          });
          const batchCall = ethersjsSf.batchCall([approveOp, updateFlowOp]);

          const txn2 = batchCall.exec(user);
          await expect(txn2).to.be.rejected;
        });

        it("should accept bid on flow decrease", async () => {
          const forSalePrice = ethers.utils.parseEther("0.1");
          const txn = await claimMediumCreate(user, 1);
          await txn.wait();

          const txn1 = await claimUpdate(user, 2); // 100
          await txn1.wait();

          const contributionRate = BigNumber.from(3170979198);
          const txn2 = await placeLargeBidCreate(bidder, 1);
          await txn2.wait();

          // Advance time
          await network.provider.send("evm_increaseTime", [700000]);
          await network.provider.send("evm_mine");

          const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
          const actionData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "bytes"],
            [await rateToPurchasePrice(BigNumber.from(0)), bidData]
          );
          const userData = ethers.utils.defaultAbiCoder.encode(
            ["uint8", "bytes"],
            [Action.BID, actionData]
          );
          const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
            receiver: superApp.address,
            flowRate: "100",
            superToken: ethx.address,
            userData: userData,
          });

          const txn3 = await updateFlowOp.exec(user);
          const receipt = await txn3.wait();

          await expect(txn3)
            .to.emit(ethx_erc20, "Transfer")
            .withArgs(superApp.address, user.address, forSalePrice);
          await expect(txn3)
            .to.emit(superApp, "BidAccepted")
            .withArgs(1, user.address, bidder.address, forSalePrice);
          await checkJailed(receipt);
          await checkUserToAppFlow(contributionRate.toString(), bidder);
          await checkAppToUserFlow("0", bidder);
          await checkUserToAppFlow("100", user);
          await checkAppToUserFlow("0", user);
          await checkAppToBeneficiaryFlow(contributionRate.add(100).toString());
          await checkCurrentOwnerBid(1, contributionRate.toNumber());
          await checkOwnerBidContributionRate(1, contributionRate.toNumber());
          await checkOutstandingBid(1, 0);
          await checkCurrentOwnerBid(2, 100);
          await checkOwnerBidContributionRate(2, 100);
          await checkOutstandingBid(2, 0);
          await checkAppNetFlow();
          expect(
            mockLicense["safeTransferFrom(address,address,uint256)"]
          ).to.have.been.calledWith(
            user.address,
            bidder.address,
            BigNumber.from(1)
          );
        });

        it("should keep outstanding bid open on owner flow delete", async () => {
          const txn = await claimCreate(user, 1); // 100
          await txn.wait();

          const txn2 = await placeBidCreate(bidder, 1); // 200
          await txn2.wait();

          // Advance time
          await network.provider.send("evm_increaseTime", [700000]);
          await network.provider.send("evm_mine");

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn3 = await deleteFlowOp.exec(user);
          const receipt = await txn3.wait();

          await expect(txn3).to.not.emit(ethx_erc20, "Transfer");
          await checkJailed(receipt);
          await checkUserToAppFlow("200", bidder);
          await checkAppToUserFlow("200", bidder);
          await checkUserToAppFlow("0", user);
          await checkAppToUserFlow("0", user);
          await checkAppToBeneficiaryFlow("0");
          await checkCurrentOwnerBid(1, 100);
          await checkOwnerBidContributionRate(1, 0);
          await checkOutstandingBid(1, 200);
          await checkAppNetFlow();
          expect(mockLicense["safeTransferFrom(address,address,uint256)"]).to
            .not.have.been.called;
        });

        it("should revert on flow increase after deleted bid", async () => {
          const txn = await claimCreate(user, 1); // 100
          await txn.wait();

          const txn2 = await placeBidCreate(bidder, 1); // 200
          await txn2.wait();

          const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
            sender: user.address,
            receiver: superApp.address,
            superToken: ethx.address,
          });

          const txn3 = await deleteFlowOp.exec(user);
          await txn3.wait();

          // Advance time
          await network.provider.send("evm_increaseTime", [700000]);
          await network.provider.send("evm_mine");

          const txn4 = placeBidCreate(user, 1);
          await expect(txn4).to.be.rejected;
        });
      });
    });

    xdescribe("Not outstanding bidder or owner", async () => {
      it("should decrease partial bid on flow decrease", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const txn2 = await rejectBid(user, existingLicenseId);
        await txn2.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(150)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          receiver: superApp.address,
          flowRate: "150",
          superToken: ethx.address,
          userData: userData,
        });

        const txn3 = await updateFlowOp.exec(bidder);
        const receipt = await txn3.wait();

        await expect(txn3).to.not.emit(ethx_erc20, "Transfer");
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("150", bidder);
        await checkAppToUserFlow("150", bidder);
        await checkAppToBeneficiaryFlow("200");
        await checkOldBid(bidder, existingLicenseId, 150);
      });

      it("should decrease partial bid on flow decrease and multiple bids", async () => {
        const txn = await claimCreate(user, 1); // 100
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2); // 100
        await txn1.wait();

        const txn2 = await placeBidUpdate(bidder, 1); // 300
        await txn2.wait();

        const txn3 = await rejectBid(user, 1); // 200
        await txn3.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(50)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );

        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          receiver: superApp.address,
          flowRate: "150",
          superToken: ethx.address,
          userData: userData,
        });

        const txn4 = await updateFlowOp.exec(bidder);
        const receipt = await txn4.wait();

        await expect(txn4).to.not.emit(ethx_erc20, "Transfer");
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("300", user);
        await checkAppToUserFlow("0", user);
        await checkUserToAppFlow("150", bidder);
        await checkAppToUserFlow("50", bidder);
        await checkAppToBeneficiaryFlow("400");
        await checkOldBid(bidder, 1, 50);
      });

      it("should decrease entire bid on flow decrease", async () => {
        const txn = await claimCreate(user, 1); // 100
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2); // 100
        await txn1.wait();

        const txn2 = await placeBidUpdate(bidder, 1); // 300
        await txn2.wait();

        const txn3 = await rejectBid(user, 1); // 200
        await txn3.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(0)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          receiver: superApp.address,
          flowRate: "100",
          superToken: ethx.address,
          userData: userData,
        });

        const txn4 = await updateFlowOp.exec(bidder);
        const receipt = await txn4.wait();

        await expect(txn4).to.not.emit(ethx_erc20, "Transfer");
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("300", user);
        await checkAppToUserFlow("0", user);
        await checkUserToAppFlow("100", bidder);
        await checkAppToUserFlow("0", bidder);
        await checkAppToBeneficiaryFlow("400");
        await checkOldBid(bidder, 1, 0);
      });

      it("should revert if decrease bid on flow decrease is too large", async () => {
        const txn = await claimCreate(user, 1);
        await txn.wait();

        const txn1 = await claimCreate(bidder, 2);
        await txn1.wait();

        const txn2 = await placeBidUpdate(bidder, 1);
        await txn2.wait();

        const txn3 = await rejectBid(user, 1);
        await txn3.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(0)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const updateFlowOp = await ethersjsSf.cfaV1.updateFlow({
          receiver: superApp.address,
          flowRate: "50",
          superToken: ethx.address,
          userData: userData,
        });

        const txn4 = updateFlowOp.exec(bidder);
        await expect(txn4).to.be.rejected;
      });

      it("should decrease bid on flow delete", async () => {
        let existingLicenseId = 2;

        const txn = await claimCreate(user, existingLicenseId);
        await txn.wait();

        const txn1 = await placeBidCreate(bidder, existingLicenseId);
        await txn1.wait();

        const txn2 = await rejectBid(user, existingLicenseId);
        await txn2.wait();

        const bidData = ethers.utils.defaultAbiCoder.encode(
          ["uint256"],
          [existingLicenseId]
        );
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes"],
          [await rateToPurchasePrice(BigNumber.from(0)), bidData]
        );
        const userData = ethers.utils.defaultAbiCoder.encode(
          ["uint8", "bytes"],
          [Action.BID, actionData]
        );
        const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
          sender: bidder.address,
          receiver: superApp.address,
          superToken: ethx.address,
          userData: userData,
        });

        const txn3 = await deleteFlowOp.exec(bidder);
        const receipt = await txn3.wait();

        await expect(txn3).to.not.emit(ethx_erc20, "Transfer");
        await checkJailed(receipt);
        await checkAppNetFlow();
        await checkUserToAppFlow("0", bidder);
        await checkAppToUserFlow("0", bidder);
        await checkAppToBeneficiaryFlow("200");
      });
    });
  });

  xdescribe("Claim Outstanding Bid", async () => {
    it("should claim bid after bidding period has elapsed", async () => {
      const forSalePrice = await rateToPurchasePrice(BigNumber.from(100));
      const txn = await claimCreate(user, 1);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, 1);
      await txn1.wait();

      // Advance time
      await network.provider.send("evm_increaseTime", [700000]);
      await network.provider.send("evm_mine");

      const txn2 = await superApp.connect(bidder).claimOutstandingBid(1);
      await txn2.wait();

      await expect(txn2)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(superApp.address, user.address, forSalePrice);
      await expect(txn2)
        .to.emit(superApp, "BidClaimed")
        .withArgs(
          1,
          user.address,
          bidder.address,
          bidder.address,
          forSalePrice
        );

      mockLicense.ownerOf.whenCalledWith(1).returns(bidder.address);

      await checkUserToAppFlow("100", user);
      await checkAppToUserFlow("100", user);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("0", bidder);
      await checkAppToBeneficiaryFlow("200");
      await checkCurrentOwnerBid(1, 200);
      await checkOwnerBidContributionRate(1, 200);
      await checkOutstandingBid(1, 0);
      await checkAppNetFlow();

      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(
        user.address,
        bidder.address,
        BigNumber.from(1)
      );
    });

    it("should claim bid after bidding period has elapsed with multiple bids", async () => {
      const forSalePrice = await rateToPurchasePrice(BigNumber.from(100));
      const txn = await claimCreate(user, 1);
      await txn.wait();

      const txn1 = await claimCreate(bidder, 2);
      await txn1.wait();

      const txn2 = await placeBidUpdate(bidder, 1);
      await txn2.wait();

      const txn3 = await placeBidUpdate(user, 2);
      await txn3.wait();

      // Advance time
      await network.provider.send("evm_increaseTime", [700000]);
      await network.provider.send("evm_mine");

      const txn4 = await superApp.connect(bidder).claimOutstandingBid(1);
      await txn4.wait();

      await expect(txn4)
        .to.emit(ethx_erc20, "Transfer")
        .withArgs(superApp.address, user.address, forSalePrice);
      await expect(txn4)
        .to.emit(superApp, "BidClaimed")
        .withArgs(
          1,
          user.address,
          bidder.address,
          bidder.address,
          forSalePrice
        );

      mockLicense.ownerOf.whenCalledWith(1).returns(bidder.address);

      await checkUserToAppFlow("400", user);
      await checkAppToUserFlow("400", user);
      await checkUserToAppFlow("400", bidder);
      await checkAppToUserFlow("0", bidder);
      await checkAppToBeneficiaryFlow("400");
      await checkCurrentOwnerBid(1, 300);
      await checkOwnerBidContributionRate(1, 300);
      await checkCurrentOwnerBid(2, 100);
      await checkOwnerBidContributionRate(2, 100);
      await checkOutstandingBid(1, 0);
      await checkOutstandingBid(2, 300);
      await checkAppNetFlow();

      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(
        user.address,
        bidder.address,
        BigNumber.from(1)
      );
    });

    it("should be able to claim bid after owner flow delete", async () => {
      const txn = await claimCreate(user, 1); // 100
      await txn.wait();

      const txn2 = await placeBidCreate(bidder, 1); // 200
      await txn2.wait();

      const deleteFlowOp = await ethersjsSf.cfaV1.deleteFlow({
        sender: user.address,
        receiver: superApp.address,
        superToken: ethx.address,
      });

      const txn3 = await deleteFlowOp.exec(user);
      await txn3.wait();

      const txn4 = await superApp.connect(bidder).claimOutstandingBid(1);
      await txn4.wait();
      mockLicense.ownerOf.whenCalledWith(1).returns(bidder.address);

      const purchasePrice = await rateToPurchasePrice(BigNumber.from(100));

      await expect(txn4)
        .to.emit(superApp, "BidClaimed")
        .withArgs(
          1,
          user.address,
          bidder.address,
          bidder.address,
          purchasePrice
        );

      await checkUserToAppFlow("0", user);
      await checkAppToUserFlow("0", user);
      await checkUserToAppFlow("200", bidder);
      await checkAppToUserFlow("0", bidder);
      await checkAppToBeneficiaryFlow("200");
      await checkCurrentOwnerBid(1, 200);
      await checkOwnerBidContributionRate(1, 200);
      await checkOutstandingBid(1, 0);
      await checkAppNetFlow();

      expect(
        mockLicense["safeTransferFrom(address,address,uint256)"]
      ).to.have.been.calledWith(
        user.address,
        bidder.address,
        BigNumber.from(1)
      );
    });

    it("should revert claim bid if bidding period has not elapsed", async () => {
      const txn = await claimCreate(user, 1);
      await txn.wait();

      const txn1 = await placeBidCreate(bidder, 1);
      await txn1.wait();

      expect(
        superApp.connect(bidder).claimOutstandingBid(1)
      ).to.be.revertedWith("Bid period has not elapsed");
    });

    it("should revert claim bid if outstanding bid does not exist", async () => {
      const txn = await claimCreate(user, 1);
      await txn.wait();

      expect(
        superApp.connect(bidder).claimOutstandingBid(1)
      ).to.be.revertedWith("Outstanding bid does not exist");
    });
  });
});
