const { assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

describe("ETHExpirationCollector", async () => {
  let accounts;
  let minExpiration = 10;
  let maxExpiration = 60 * 60 * 24 * 730; // 730 days

  async function buildContract({ license, accountant }) {
    const ETHExpirationCollector = await ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy();
    await collector.deployed();
    await collector.setMinExpiration(minExpiration);
    await collector.setMaxExpiration(maxExpiration);
    await collector.setReceiver(accounts[1].address);
    if (license) {
      await collector.setLicense(license);
    }
    if (accountant) {
      await collector.setAccountant(accountant);
    }
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

  it("should only allow admin to pause payments and contribution changes", async () => {
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
      await collector.connect(accounts[1]).pause();
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await collector.pause();

    var err;
    try {
      await collector
        .connect(accounts[2])
        .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("paused"),
      "Expected an error but did not get one"
    );

    var err;
    try {
      await collector.connect(accounts[2]).makePayment(1, { value: 1000 });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("paused"),
      "Expected an error but did not get one"
    );

    await collector.unpause();

    await collector
      .connect(accounts[2])
      .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });

    await collector.connect(accounts[2]).makePayment(1, { value: 1000 });
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

  it("should allow setting contribution rate if approved for all", async () => {
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

    await license
      .connect(accounts[2])
      .setApprovalForAll(accounts[0].address, true);

    await collector
      .connect(accounts[0])
      .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
  });

  it("should allow setting contribution rate if approved", async () => {
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

    await license.connect(accounts[2]).approve(accounts[0].address, 1);

    await collector
      .connect(accounts[0])
      .setContributionRate(1, 10, { value: ethers.utils.parseEther("1") });
  });

  it("should fail to set contribution rate if too low", async () => {
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

    await collector.setMinContributionRate(10);

    await license.mint(accounts[2].address, 1);

    var err;
    try {
      await collector.connect(accounts[2]).setContributionRate(1, 1);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Contribution rate must be greater than minimum"),
      "Expected an error but did not get one"
    );
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

    let contributionRate = await accountant.contributionRates(1);
    assert.equal(
      contributionRate,
      10,
      "Did not set contribution rate on Accountant"
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

    let contributionRate = await accountant.contributionRates(1);
    assert.equal(
      contributionRate,
      30,
      "Did not set contribution rate on Accountant"
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

    let contributionRate = await accountant.contributionRates(1);
    assert.equal(
      contributionRate,
      10,
      "Did not set contribution rate on Accountant"
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

    let contributionRate = await accountant.contributionRates(1);
    assert.equal(
      contributionRate,
      10,
      "Did not set contribution rate on Accountant"
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

    let contributionRate = await accountant.contributionRates(1);
    assert.equal(
      contributionRate,
      1,
      "Did not set contribution rate on Accountant"
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

  it("should allow MODIFY_FUNDS_ROLE to migrate all funds to another parcel", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let originalContributionRate2 = await accountant.contributionRates(2);

    var err;
    try {
      await collector
        .connect(accounts[2])
        .migrateFunds(1, 2, originalContributionRate2);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("is missing role"),
      "Expected an error but did not get one"
    );

    let result = await collector
      .connect(accounts[1])
      .migrateFunds(1, 2, originalContributionRate2);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(newExpiration1, 0, "FROM expiration was not cleared");
    assert.equal(
      contributionRate1,
      0,
      "Did not clear contribution rate on Accountant"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      originalExpiration2 -
        block.timestamp +
        (originalExpiration1 - block.timestamp),
      "TO expiration was not updated correctly"
    );
  });

  it("should set expiration to max if migrate funds reaches max", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 1, {
      value: maxExpiration,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 1, {
      value: maxExpiration,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let originalContributionRate2 = await accountant.contributionRates(2);

    let result = await collector
      .connect(accounts[1])
      .migrateFunds(1, 2, originalContributionRate2);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(newExpiration1, 0, "FROM expiration was not cleared");
    assert.equal(
      contributionRate1,
      0,
      "Did not clear contribution rate on Accountant"
    );
    assert.equal(
      contributionRate2,
      1,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      newExpiration2,
      block.timestamp + maxExpiration,
      "TO expiration was not updated correctly"
    );
  });

  it("should update contribution rate on migrate funds", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let result = await collector.connect(accounts[1]).migrateFunds(1, 2, 1);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(newExpiration1, 0, "FROM expiration was not cleared");
    assert.equal(
      contributionRate1,
      0,
      "Did not clear contribution rate on Accountant"
    );
    assert.equal(
      contributionRate2,
      1,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      (originalExpiration2 -
        block.timestamp +
        (originalExpiration1 - block.timestamp)) *
        10,
      "TO expiration was not updated correctly"
    );
  });

  it("should fail to migrate funds if contribution rate is too low", async () => {
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

    await collector.setMinContributionRate(10);

    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    var err;
    try {
      await collector.connect(accounts[1]).migrateFunds(1, 2, 1);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Contribution rate must be greater than minimum"),
      "Expected an error but did not get one"
    );
  });

  it("should make additional payment on migrate funds", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let originalContributionRate2 = await accountant.contributionRates(2);

    let result = await collector
      .connect(accounts[1])
      .migrateFunds(1, 2, originalContributionRate2, { value: 10 });
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(newExpiration1, 0, "FROM expiration was not cleared");
    assert.equal(
      contributionRate1,
      0,
      "Did not clear contribution rate on Accountant"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      originalExpiration2 -
        block.timestamp +
        (originalExpiration1 - block.timestamp) +
        1,
      "TO expiration was not updated correctly"
    );
  });

  it("should not trim max expiration on migrate funds if new contribution rate is high enough", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 1, {
      value: maxExpiration,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 1, {
      value: maxExpiration,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let originalContributionRate2 = await accountant.contributionRates(2);

    let result = await collector.connect(accounts[1]).migrateFunds(1, 2, 10);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(newExpiration1, 0, "FROM expiration was not cleared");
    assert.equal(
      contributionRate1,
      0,
      "Did not clear contribution rate on Accountant"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      Math.floor(
        (originalExpiration2 -
          block.timestamp +
          (originalExpiration1 - block.timestamp)) /
          10
      ),
      "TO expiration was not updated correctly"
    );
  });

  it("should allow MODIFY_FUNDS_ROLE to move funds between parcels", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let originalContributionRate1 = await accountant.contributionRates(1);
    let originalContributionRate2 = await accountant.contributionRates(2);

    var err;
    try {
      await collector
        .connect(accounts[2])
        .moveFunds(
          1,
          originalContributionRate1,
          0,
          2,
          originalContributionRate2,
          0,
          500
        );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("is missing role"),
      "Expected an error but did not get one"
    );

    let result = await collector
      .connect(accounts[1])
      .moveFunds(
        1,
        originalContributionRate1,
        0,
        2,
        originalContributionRate2,
        0,
        500
      );
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(
      contributionRate1,
      10,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      newExpiration1 - block.timestamp,
      originalExpiration1 - block.timestamp - 50,
      "FROM expiration was not updated correctly"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      originalExpiration2 - block.timestamp + 50,
      "TO expiration was not updated correctly"
    );
  });

  it("should not move funds between parcels if minExpiration is not met", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalContributionRate1 = await accountant.contributionRates(1);
    let originalContributionRate2 = await accountant.contributionRates(2);

    var err;
    try {
      await collector
        .connect(accounts[1])
        .moveFunds(
          1,
          originalContributionRate1,
          0,
          2,
          originalContributionRate2,
          0,
          900
        );
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

  it("should not move funds between parcels if FROM does not have enough funds", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalContributionRate1 = await accountant.contributionRates(1);
    let originalContributionRate2 = await accountant.contributionRates(2);

    var err;
    try {
      await collector
        .connect(accounts[1])
        .moveFunds(
          1,
          originalContributionRate1,
          0,
          2,
          originalContributionRate2,
          0,
          1000
        );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Not enough funds in FROM"),
      "Expected an error but did not get one"
    );
  });

  it("should set expiration to max if move funds reaches max", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 1, {
      value: maxExpiration,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 1, {
      value: maxExpiration,
    });

    let originalContributionRate1 = await accountant.contributionRates(1);
    let originalContributionRate2 = await accountant.contributionRates(2);

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let result = await collector
      .connect(accounts[1])
      .moveFunds(
        1,
        originalContributionRate1,
        0,
        2,
        originalContributionRate2,
        0,
        500
      );
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(
      contributionRate1,
      1,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      contributionRate2,
      1,
      "Did not keep contribution rate the same after migration"
    );
    assert.equal(
      newExpiration1 - block.timestamp,
      originalExpiration1 - block.timestamp - 500,
      "FROM expiration was not updated correctly"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      maxExpiration,
      "TO expiration was not updated correctly"
    );
  });

  it("should update contribution rates on move funds", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let result = await collector
      .connect(accounts[1])
      .moveFunds(1, 1, 0, 2, 1, 0, 500);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(
      contributionRate1,
      1,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      contributionRate2,
      1,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      newExpiration1 - block.timestamp,
      (originalExpiration1 - block.timestamp - 50) * 10,
      "FROM expiration was not updated correctly"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      (originalExpiration2 - block.timestamp + 50) * 10,
      "TO expiration was not updated correctly"
    );
  });

  it("should make additional payments on move funds", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let result = await collector
      .connect(accounts[1])
      .moveFunds(1, 10, 10, 2, 10, 10, 500, { value: 20 });
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(
      contributionRate1,
      10,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      newExpiration1 - block.timestamp,
      originalExpiration1 - block.timestamp - 50 + 1,
      "FROM expiration was not updated correctly"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      originalExpiration2 - block.timestamp + 50 + 1,
      "TO expiration was not updated correctly"
    );
  });

  it("should fail to move funds if additional payment is not made", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    var err;
    try {
      await collector.connect(accounts[1]).moveFunds(1, 10, 10, 2, 10, 10, 500);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Additional payments must be sent"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to move funds if TO contribution rate is too low", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.setMinContributionRate(10);

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    var err;
    try {
      await collector.connect(accounts[1]).moveFunds(1, 10, 10, 2, 1, 10, 500);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Contribution rate must be greater than minimum"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to move funds if FROM contribution rate is too low", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.setMinContributionRate(10);

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: 1000,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 10, {
      value: 1000,
    });

    var err;
    try {
      await collector.connect(accounts[1]).moveFunds(1, 1, 10, 2, 10, 10, 500);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Contribution rate must be greater than minimum"),
      "Expected an error but did not get one"
    );
  });

  it("should ignore expiration limits on move funds until after new contribution rate is included", async () => {
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
    let MODIFY_FUNDS_ROLE = await collector.MODIFY_FUNDS_ROLE();

    await collector.grantRole(MODIFY_FUNDS_ROLE, accounts[1].address);
    await license.mint(accounts[2].address, 1);
    await license.mint(accounts[2].address, 2);

    await collector.connect(accounts[2]).setContributionRate(1, 10, {
      value: maxExpiration,
    });
    await collector.connect(accounts[2]).setContributionRate(2, 1, {
      value: maxExpiration,
    });

    let originalExpiration1 = await collector.licenseExpirationTimestamps(1);
    let originalExpiration2 = await collector.licenseExpirationTimestamps(2);

    let result = await collector
      .connect(accounts[1])
      .moveFunds(1, 1, 0, 2, 10, 0, maxExpiration - 50);
    let receipt = await result.wait();
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    let newExpiration1 = await collector.licenseExpirationTimestamps(1);
    let newExpiration2 = await collector.licenseExpirationTimestamps(2);

    let contributionRate1 = await accountant.contributionRates(1);
    let contributionRate2 = await accountant.contributionRates(2);

    assert.equal(
      contributionRate1,
      1,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      contributionRate2,
      10,
      "Did not update contribution rate after migration"
    );
    assert.equal(
      newExpiration1 - block.timestamp,
      (originalExpiration1 - block.timestamp) * 10 - (maxExpiration - 50),
      "FROM expiration was not updated correctly"
    );
    assert.equal(
      newExpiration2 - block.timestamp,
      Math.floor(
        (originalExpiration2 - block.timestamp + maxExpiration - 50) / 10
      ),
      "TO expiration was not updated correctly"
    );
  });
});
