const { assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

describe("SimpleETHClaimer", async () => {
  let accounts;
  let minExpiration = 10;

  async function buildContract({ license, collector, parcel }) {
    const licenseAddress = license ?? ethers.constants.AddressZero;
    const collectorAddress = collector ?? ethers.constants.AddressZero;
    const parcelAddress = parcel ?? ethers.constants.AddressZero;

    const SimpleETHClaimer = await ethers.getContractFactory(
      "SimpleETHClaimer"
    );
    const claimer = await SimpleETHClaimer.deploy(
      minExpiration,
      licenseAddress,
      collectorAddress,
      parcelAddress
    );
    await claimer.deployed();

    return claimer;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should only allow admin to set minClaimExpiration", async () => {
    let claimer = await buildContract({});

    var err;
    try {
      await claimer
        .connect(accounts[1])
        .setMinClaimExpiration(BigNumber.from(20));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await claimer.setMinClaimExpiration(BigNumber.from(20));

    const value = await claimer.minClaimExpiration();
    assert(value.eq(BigNumber.from(20)), "Value was not updated");
  });

  it("should only allow admin to set license", async () => {
    let claimer = await buildContract({});

    var err;
    try {
      await claimer.connect(accounts[1]).setLicense(claimer.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await claimer.setLicense(claimer.address);

    const value = await claimer.license();
    assert(value == claimer.address, "Value was not updated");
  });

  it("should only allow admin to set collector", async () => {
    let claimer = await buildContract({});

    var err;
    try {
      await claimer.connect(accounts[1]).setCollector(claimer.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await claimer.setCollector(claimer.address);

    const value = await claimer.collector();
    assert(value == claimer.address, "Value was not updated");
  });

  it("should only allow admin to set parcel", async () => {
    let claimer = await buildContract({});

    var err;
    try {
      await claimer.connect(accounts[1]).setParcel(claimer.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await claimer.setParcel(claimer.address);

    const value = await claimer.parcel();
    assert(value == claimer.address, "Value was not updated");
  });

  it("should only allow admin to pause claims", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockParcel = await ethers.getContractFactory("MockParcel");
    const parcel = await MockParcel.deploy();
    await parcel.deployed();

    const minPayment = 1;

    const MockCollector = await ethers.getContractFactory("MockCollector");
    const collector = await MockCollector.deploy(1000, minPayment);
    await collector.deployed();

    let claimer = await buildContract({
      parcel: parcel.address,
      license: license.address,
      collector: collector.address,
    });

    var err;
    try {
      await claimer.connect(accounts[1]).pause();
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await claimer.pause();

    var err;
    try {
      await claimer.claim(accounts[1].address, 1, [BigNumber.from(0)], 10, {
        value: minPayment,
      });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("paused"),
      "Expected an error but did not get one"
    );

    await claimer.unpause();

    await claimer.claim(accounts[1].address, 1, [BigNumber.from(0)], 10, {
      value: minPayment,
    });
  });

  it("should claim a parcel", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockParcel = await ethers.getContractFactory("MockParcel");
    const parcel = await MockParcel.deploy();
    await parcel.deployed();

    const minPayment = 1;

    const MockCollector = await ethers.getContractFactory("MockCollector");
    const collector = await MockCollector.deploy(1000, minPayment);
    await collector.deployed();

    let claimer = await buildContract({
      parcel: parcel.address,
      license: license.address,
      collector: collector.address,
    });

    const result = await claimer.claim(
      accounts[1].address,
      1,
      [BigNumber.from(0)],
      10,
      { value: minPayment }
    );

    const receipt = await result.wait();
    const newParcelId = receipt.events[0].args.parcelId;

    assert(await license.exists(newParcelId), "License was not minted");
    assert((await parcel.nextId()) > 0, "Parcel was not built");
    assert(
      (await collector.licenseExpirationTimestamps(newParcelId)) > 0,
      "Collector was not called"
    );
  });

  it("should fail to claim a parcel if minClaimExpiration is not reached", async () => {
    const MockERC721License = await ethers.getContractFactory(
      "MockERC721License"
    );
    const license = await MockERC721License.deploy("Mock", "MOCK");
    await license.deployed();

    const MockParcel = await ethers.getContractFactory("MockParcel");
    const parcel = await MockParcel.deploy();
    await parcel.deployed();

    const minPayment = 1;
    const defaultExpiration = 1;

    const MockCollector = await ethers.getContractFactory("MockCollector");
    const collector = await MockCollector.deploy(defaultExpiration, minPayment);
    await collector.deployed();

    let claimer = await buildContract({
      parcel: parcel.address,
      license: license.address,
      collector: collector.address,
    });

    var err;
    try {
      await claimer.claim(accounts[1].address, 1, [BigNumber.from(0)], 10, {
        value: minPayment,
      });
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be at least minClaimExpiration"
      ),
      "Expected an error but did not get one"
    );
  });
});
