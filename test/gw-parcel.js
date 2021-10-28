const { assert } = require("chai");
const { ethers } = require("hardhat");

const BigNumber = ethers.BigNumber;

describe("GeoWebParcel", async () => {
  function makePathPrefix(length) {
    return BigNumber.from(length).shl(256 - 8);
  }

  let geoWebParcel;
  let accounts;

  before(async () => {
    accounts = await ethers.getSigners();

    const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
    geoWebParcel = await GeoWebParcel.deploy(accounts[0].address);
    await geoWebParcel.deployed();
  });

  it("should mint parcel of a single coordinate", async () => {
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    let mintTx = await geoWebParcel.mintLandParcel(coord, [BigNumber.from(0)]);

    let mintResult = await mintTx.wait();

    let result = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result.toString(),
      BigNumber.from(1).shl(20).toString(),
      "Incorrect availability"
    );

    let parcel = await geoWebParcel.getLandParcel(
      mintResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );
  });

  it("should mint parcel within one word", async () => {
    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    // North, North, West
    let mintTx = await geoWebParcel.mintLandParcel(coord, [
      makePathPrefix(3).or(BigNumber.from(0b110000)),
    ]);

    let mintResult = await mintTx.wait();

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
      mintResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );
  });

  it("should mint parcel that spans multiple words", async () => {
    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    let coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    // East, North
    // East -> Index(1, 0), Local(0, 1)
    let mintTx = await geoWebParcel.mintLandParcel(coord, [
      makePathPrefix(2).or(BigNumber.from(0b0010)),
    ]);

    let mintResult = await mintTx.wait();

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
      mintResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );
  });

  it("should mint parcel with a long path", async () => {
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
    let mintTx = await geoWebParcel.mintLandParcel(coord, [path1, path2]);
    let mintResult = await mintTx.wait();

    for (let i = 0; i < 128 / 16; i++) {
      let result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(2).shl(15).sub(BigNumber.from(1)).toString(),
        "Incorrect availability for " + i
      );
    }

    let parcel = await geoWebParcel.getLandParcel(
      mintResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );
  });

  it("should mint parcel that crosses the meridian", async () => {
    // Global(0, 160) -> Index(0, 10), Local(0, 0)
    let coord = BigNumber.from(0).shl(32).or(BigNumber.from(160));

    // West -> Index(MAX/16, 10), Local(15, 0)
    let mintTx = await geoWebParcel.mintLandParcel(coord, [
      makePathPrefix(1).or(BigNumber.from(0b11)),
    ]);
    let mintResult = await mintTx.wait();

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
      mintResult.events[0].args._id
    );
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );
  });

  it("should not mint parcel that goes too far north", async () => {
    // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
    let coord = BigNumber.from(16000)
      .shl(32)
      .or(BigNumber.from(2 ** 18 - 1));

    var err;
    try {
      // North
      await geoWebParcel.mintLandParcel(coord, [
        makePathPrefix(1).or(BigNumber.from(0b00)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not mint parcel that goes too far south", async () => {
    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // South
      await geoWebParcel.mintLandParcel(coord, [
        makePathPrefix(1).or(BigNumber.from(0b01)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not mint parcel that repeats coordinates", async () => {
    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // West, East
      await geoWebParcel.mintLandParcel(coord, [
        makePathPrefix(2).or(BigNumber.from(0b1011)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not mint parcel if caller is not minter", async () => {
    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // North
      await geoWebParcel.mintLandParcel(
        coord,
        [makePathPrefix(1).or(BigNumber.from(0b00))],
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });
});
