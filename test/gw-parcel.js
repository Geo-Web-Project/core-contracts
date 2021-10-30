const { assert } = require("chai");
const { ethers } = require("hardhat");

const BigNumber = ethers.BigNumber;

describe("GeoWebParcel", async () => {
  function makePathPrefix(length) {
    return BigNumber.from(length).shl(256 - 8);
  }

  let accounts;

  async function buildContract() {
    const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
    const geoWebParcel = await GeoWebParcel.deploy();
    await geoWebParcel.deployed();

    return geoWebParcel;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should build and destroy a parcel of a single coordinate", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    let buildTx = await geoWebParcel.build(coord, [BigNumber.from(0)]);

    let buildResult = await buildTx.wait();

    let result = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result.toString(),
      BigNumber.from(1).shl(20).toString(),
      "Incorrect availability"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel within one word", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    // North, North, West
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(3).or(BigNumber.from(0b110000)),
    ]);

    let buildResult = await buildTx.wait();

    let result = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result.toString(),
      BigNumber.from(1)
        .shl(20)
        .or(BigNumber.from(1).shl(36))
        .or(BigNumber.from(1).shl(52))
        .or(BigNumber.from(1).shl(51))
        .toString(),
      "Incorrect availability"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result1 = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel that spans multiple words", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    let coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    // East, North
    // East -> Index(1, 0), Local(0, 1)
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(2).or(BigNumber.from(0b0010)),
    ]);

    let buildResult = await buildTx.wait();

    let result0 = await geoWebParcel.availabilityIndex(0, 0);
    let result1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0.toString(),
      BigNumber.from(1).shl(31).toString(),
      "Incorrect availability for index 0"
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(16).or(BigNumber.from(1).shl(32)).toString(),
      "Incorrect availability for index 1"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result0_1 = await geoWebParcel.availabilityIndex(0, 0);
    let result1_1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );
    assert.equal(
      result1_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel with a long path", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(511, 0) -> Index(31, 0), Local(15, 0)
    let coord = BigNumber.from(511).shl(32).or(BigNumber.from(0));

    // West 124 times
    let path1 = makePathPrefix(124).or(
      BigNumber.from(2)
        .shl(248 - 1)
        .sub(BigNumber.from(1))
    );
    // West 3 times
    let path2 = makePathPrefix(3).or(BigNumber.from(0b111111));
    let buildTx = await geoWebParcel.build(coord, [path1, path2]);
    let buildResult = await buildTx.wait();

    for (let i = 0; i < 128 / 16; i++) {
      let result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(2).shl(15).sub(BigNumber.from(1)).toString(),
        "Incorrect availability for " + i
      );
    }

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    for (let i = 0; i < 128 / 16; i++) {
      let result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(0).toString(),
        "Parcel coordinates were not destroyed"
      );
    }

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel that crosses the meridian", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(0, 160) -> Index(0, 10), Local(0, 0)
    let coord = BigNumber.from(0).shl(32).or(BigNumber.from(160));

    // West -> Index(MAX/16, 10), Local(15, 0)
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(1).or(BigNumber.from(0b11)),
    ]);
    let buildResult = await buildTx.wait();

    let result0 = await geoWebParcel.availabilityIndex(0, 10);
    let result1 = await geoWebParcel.availabilityIndex(2 ** 19 / 16 - 1, 10);

    assert.equal(
      result0.toString(),
      BigNumber.from(1).toString(),
      "Incorrect availability for index 0"
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(15).toString(),
      "Incorrect availability for index 1"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result0_1 = await geoWebParcel.availabilityIndex(0, 10);
    let result1_1 = await geoWebParcel.availabilityIndex(2 ** 19 / 16 - 1, 10);
    assert.equal(
      result0_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );
    assert.equal(
      result1_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel that repeats coordinates", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    // North, North, West, East
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(4).or(BigNumber.from(0b10110000)),
    ]);

    let buildResult = await buildTx.wait();

    let result = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result.toString(),
      BigNumber.from(1)
        .shl(20)
        .or(BigNumber.from(1).shl(36))
        .or(BigNumber.from(1).shl(52))
        .or(BigNumber.from(1).shl(51))
        .toString(),
      "Incorrect availability"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result1 = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should build and destroy parcel that repeats coordinates across multiple words", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    let coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    // East, North, South, West
    // East -> Index(1, 0), Local(0, 1)
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(4).or(BigNumber.from(0b11010010)),
    ]);

    let buildResult = await buildTx.wait();

    let result0 = await geoWebParcel.availabilityIndex(0, 0);
    let result1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0.toString(),
      BigNumber.from(1).shl(31).toString(),
      "Incorrect availability for index 0"
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(16).or(BigNumber.from(1).shl(32)).toString(),
      "Incorrect availability for index 1"
    );

    let parcel = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result0_1 = await geoWebParcel.availabilityIndex(0, 0);
    let result1_1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );
    assert.equal(
      result1_1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should not build parcel that overlaps with a existing parcel", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    await geoWebParcel.build(coord, [BigNumber.from(0)]);

    var err;
    try {
      // North
      await geoWebParcel.build(coord, [BigNumber.from(0)]);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Coordinate is not available"),
      "Expected an error but did not get one"
    );
  });

  it("should not build parcel that goes too far north", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);

    // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
    let coord = BigNumber.from(16000)
      .shl(32)
      .or(BigNumber.from(2 ** 18 - 1));

    var err;
    try {
      // North
      await geoWebParcel.build(coord, [
        makePathPrefix(1).or(BigNumber.from(0b00)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not build parcel that goes too far south", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // South
      await geoWebParcel.build(coord, [
        makePathPrefix(1).or(BigNumber.from(0b01)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not build parcel if caller does not have BUILD_ROLE", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // North
      await geoWebParcel
        .connect(accounts[1])
        .build(coord, [makePathPrefix(1).or(BigNumber.from(0b00))]);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("missing role"),
      "Expected an error but did not get one"
    );
  });

  it("should not build parcel with empty path", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // North
      await geoWebParcel.build(coord, []);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Path must have at least one component"),
      "Expected an error but did not get one"
    );
  });

  it("should only destroy one parcel within a word", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    // Global(4, 34) -> Index(0, 2), Local(4, 2)
    let coord1 = BigNumber.from(4).shl(32).or(BigNumber.from(34));

    await geoWebParcel.build(coord, [BigNumber.from(0)]);
    let buildTx = await geoWebParcel.build(coord1, [BigNumber.from(0)]);
    let buildResult = await buildTx.wait();

    await geoWebParcel.destroy(buildResult.events[0].args._id);

    let result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(20).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(
      buildResult.events[0].args._id
    );
    assert.equal(
      parcel1.baseCoordinate.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
    assert.equal(
      parcel1.path.toString(),
      0,
      "Parcel was not marked as destroyed"
    );
  });

  it("should not destroy parcel if caller does not have DESTROY_ROLE", async () => {
    let geoWebParcel = await buildContract();
    let BUILD_ROLE = await geoWebParcel.BUILD_ROLE();
    let DESTROY_ROLE = await geoWebParcel.DESTROY_ROLE();

    await geoWebParcel.grantRole(BUILD_ROLE, accounts[0].address);
    await geoWebParcel.grantRole(DESTROY_ROLE, accounts[0].address);

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let buildTx = await geoWebParcel.build(coord, [BigNumber.from(0)]);

    let buildResult = await buildTx.wait();
    let parcelId = buildResult.events[0].args._id;
    var err;
    try {
      await geoWebParcel.connect(accounts[1]).destroy(parcelId);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("missing role"),
      "Expected an error but did not get one"
    );
  });
});
