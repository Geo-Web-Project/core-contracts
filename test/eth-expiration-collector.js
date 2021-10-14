const { assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

describe("ETHExpirationCollector", async () => {
  let accounts;
  let minExpiration = 10;
  let maxExpiration = 60 * 60 * 24 * 730; // 730 days

  async function buildContract({ license, accountant }) {
    const licenseAddress = license ?? ethers.constants.AddressZero;
    const accountantAddress = accountant ?? ethers.constants.AddressZero;

    const ETHExpirationCollector = await ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy(
      BigNumber.from(0),
      minExpiration,
      maxExpiration,
      licenseAddress,
      accounts[1].address,
      accountantAddress
    );
    await collector.deployed();

    return collector;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should only allow admin to set minContributionRate", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector
        .connect(accounts[1])
        .setMinContributionRate(BigNumber.from(10));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setMinContributionRate(BigNumber.from(10));

    const value = await collector.minContributionRate();
    assert(value.eq(BigNumber.from(10)), "Value was not updated");
  });

  it("should only allow admin to set minExpiration", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector.connect(accounts[1]).setMinExpiration(BigNumber.from(20));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setMinExpiration(BigNumber.from(20));

    const value = await collector.minExpiration();
    assert(value.eq(BigNumber.from(20)), "Value was not updated");
  });

  it("should only allow admin to set maxExpiration", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector.connect(accounts[1]).setMaxExpiration(BigNumber.from(30));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setMaxExpiration(BigNumber.from(30));

    const value = await collector.maxExpiration();
    assert(value.eq(BigNumber.from(30)), "Value was not updated");
  });

  it("should only allow admin to set license", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector.connect(accounts[1]).setLicense(collector.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setLicense(collector.address);

    const value = await collector.license();
    assert(value == collector.address, "Value was not updated");
  });

  it("should only allow admin to set receiver", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector.connect(accounts[1]).setReceiver(collector.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setReceiver(collector.address);

    const value = await collector.receiver();
    assert(value == collector.address, "Value was not updated");
  });

  it("should only allow admin to set accountant", async () => {
    let collector = await buildContract({});

    var err;
    try {
      await collector.connect(accounts[1]).setAccountant(collector.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.setAccountant(collector.address);

    const value = await collector.accountant();
    assert(value == collector.address, "Value was not updated");
  });

  it("should not allow setting contribution rate without permission", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    var err;
    try {
      await collector.connect(accounts[0]).setContributionRate(1, 10);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Caller does not have permission"),
      "Expected an error but did not get one"
    );
  });

  it("should allow setting contribution rate if license holder", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    var err;
    try {
      await collector
        .connect(accounts[0])
        .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Caller does not have permission"),
      "Expected an error but did not get one"
    );

    await collector
      .connect(accounts[2])
      .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
  });

  it("should allow setting contribution rate if role", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });
    let MODIFY_CONTRIBUTION_ROLE = await collector.MODIFY_CONTRIBUTION_ROLE();

    await license.mint(accounts[2].address, 1);

    var err;
    try {
      await collector
        .connect(accounts[0])
        .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Caller does not have permission"),
      "Expected an error but did not get one"
    );

    await collector.grantRole(MODIFY_CONTRIBUTION_ROLE, accounts[0].address);

    await collector
      .connect(accounts[0])
      .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
  });

  it("should set initial expiration", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    let result = await collector
      .connect(accounts[2])
      .setContributionRate(1, 10, {
        value: 1000,
      });
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration = await collector.licenseExpirationTimestamps(1);
    assert.equal(
      newExpiration,
      block.timestamp + 1000 / 10,
      "Expiration was not updated correctly"
    );
  });

  it("should update expiration when contribution is increased", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });

    let originalExpiration = await collector.licenseExpirationTimestamps(1);

    let result = await collector
      .connect(accounts[2])
      .setContributionRate(1, 30);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration = await collector.licenseExpirationTimestamps(1);

    assert.equal(
      newExpiration - block.timestamp,
      Math.floor((originalExpiration - block.timestamp) / 3),
      "Expiration was not updated correctly"
    );
  });

  it("should update expiration when contribution is decreased", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    await collector.connect(accounts[2]).setContributionRate(1, 20, {
      value: 1000,
    });

    let originalExpiration = await collector.licenseExpirationTimestamps(1);

    let result = await collector
      .connect(accounts[2])
      .setContributionRate(1, 10);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration = await collector.licenseExpirationTimestamps(1);

    assert.equal(
      newExpiration - block.timestamp,
      (originalExpiration - block.timestamp) * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should update expiration when payment is made", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });

    let originalExpiration = await collector.licenseExpirationTimestamps(1);

    let result = await collector
      .connect(accounts[2])
      .makePayment(1, { value: 1000 });
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration = await collector.licenseExpirationTimestamps(1);

    assert.equal(
      newExpiration - block.timestamp,
      originalExpiration - block.timestamp + 100,
      "Expiration was not updated correctly"
    );
  });

  it("should set expiration to max if contribution reaches max", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    let result = await collector
      .connect(accounts[2])
      .setContributionRate(1, 1, {
        value: maxExpiration * 2,
      });
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration = await collector.licenseExpirationTimestamps(1);
    assert.equal(
      newExpiration,
      block.timestamp + maxExpiration,
      "Expiration was not updated correctly"
    );
  });

  it("should fail to set expiration if < min", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockAccountant = await ethers.getContractFactory("MockAccountant");
    const accountant = await MockAccountant.deploy(1, 2);
    await accountant.deployed();

    let collector = await buildContract({
      license: license.address,
      accountant: accountant.address,
    });

    await license.mint(accounts[2].address, 1);

    var err;
    try {
      await collector.connect(accounts[2]).setContributionRate(1, 1, {
        value: minExpiration - 1,
      });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be at least minExpiration"
      ),
      "Expected an error but did not get one"
    );
  });
});
