import { assert, expect, use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";

use(solidity);

describe("GeoWebParcel", async () => {
  function makePathPrefix(length: any) {
    return BigNumber.from(length).shl(256 - 8);
  }

  let accounts: SignerWithAddress[];
  let max_x: BigNumber;
  let max_y: BigNumber;

  async function buildContract() {
    const GeoWebCoordinate = await ethers.getContractFactory(
      "LibGeoWebCoordinate"
    );
    const geoWebCoordinate = await GeoWebCoordinate.deploy();
    await geoWebCoordinate.deployed();

    max_x = await geoWebCoordinate.MAX_X();
    max_y = await geoWebCoordinate.MAX_Y();

    const GeoWebParcel = await ethers.getContractFactory(
      "TestableGeoWebParcelFacet"
    );
    const geoWebParcel = await GeoWebParcel.deploy();
    await geoWebParcel.deployed();

    return geoWebParcel;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should build and destroy a parcel of a single coordinate", async () => {
    let geoWebParcel = await buildContract();

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

    const parcelId = buildResult.events![0].topics[1];
    let parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(parcelId);

    let result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });

  it("should build and destroy parcel within one word", async () => {
    let geoWebParcel = await buildContract();

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

    const parcelId = buildResult.events![0].topics[1];
    let parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(parcelId);

    let result1 = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });

  it("should build and destroy parcel that spans multiple words", async () => {
    let geoWebParcel = await buildContract();

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

    const parcelId = buildResult.events![0].topics[1];
    let parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(parcelId);

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

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });

  it("should build and destroy parcel with a long path", async () => {
    let geoWebParcel = await buildContract();

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

    const parcelId = buildResult.events![0].topics[1];
    let parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(parcelId);

    for (let i = 0; i < 128 / 16; i++) {
      let result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(0).toString(),
        "Parcel coordinates were not destroyed"
      );
    }

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });

  it("should build and destroy parcel that crosses the meridian", async () => {
    let geoWebParcel = await buildContract();

    // Global(0, 160) -> Index(0, 10), Local(0, 0)
    let coord = BigNumber.from(0).shl(32).or(BigNumber.from(160));

    // West -> Index(MAX/16, 10), Local(15, 0)
    let buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(1).or(BigNumber.from(0b11)),
    ]);
    let buildResult = await buildTx.wait();

    let result0 = await geoWebParcel.availabilityIndex(0, 10);
    let result1 = await geoWebParcel.availabilityIndex(
      max_x.add(1).div(16).sub(1),
      10
    );

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

    const parcelId = buildResult.events![0].topics[1];
    let parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      "Stored base coordinate is incorrect"
    );

    await geoWebParcel.destroy(parcelId);

    let result0_1 = await geoWebParcel.availabilityIndex(0, 10);
    let result1_1 = await geoWebParcel.availabilityIndex(
      max_x.add(1).div(16).sub(1),
      10
    );
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

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });

  it("should not build parcel that repeats coordinates", async () => {
    let geoWebParcel = await buildContract();

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    var err;
    try {
      // North, North, West, East
      let buildTx = await geoWebParcel.build(coord, [
        makePathPrefix(4).or(BigNumber.from(0b10110000)),
      ]);

      await buildTx.wait();
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Coordinate is not available"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel that repeats coordinates across multiple words", async () => {
    let geoWebParcel = await buildContract();

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    let coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    var err;
    try {
      // East, North, South, West
      // East -> Index(1, 0), Local(0, 1)
      let buildTx = await geoWebParcel.build(coord, [
        makePathPrefix(4).or(BigNumber.from(0b11010010)),
      ]);

      await buildTx.wait();
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Coordinate is not available"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel that overlaps with a existing parcel", async () => {
    let geoWebParcel = await buildContract();

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

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Coordinate is not available"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel that goes too far north", async () => {
    let geoWebParcel = await buildContract();

    // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
    let coord = BigNumber.from(16000).shl(32).or(max_y);

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

  it("should not build parcel with empty path", async () => {
    let geoWebParcel = await buildContract();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    let coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    var err;
    try {
      // North
      await geoWebParcel.build(coord, []);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Path must have at least one component"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should only destroy one parcel within a word", async () => {
    let geoWebParcel = await buildContract();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    // Global(4, 34) -> Index(0, 2), Local(4, 2)
    let coord1 = BigNumber.from(4).shl(32).or(BigNumber.from(34));

    await geoWebParcel.build(coord, [BigNumber.from(0)]);
    let buildTx = await geoWebParcel.build(coord1, [BigNumber.from(0)]);
    let buildResult = await buildTx.wait();

    const parcelId = buildResult.events![0].topics[1];
    await geoWebParcel.destroy(parcelId);

    let result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(20).toString(),
      "Parcel coordinates were not destroyed"
    );

    let parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      "Parcel was not marked as destroyed"
    );
    expect(parcel1.path, "Parcel was not marked as destroyed").to.be.empty;
  });
});
