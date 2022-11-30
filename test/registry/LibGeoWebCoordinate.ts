import { assert } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

const BigNumber = ethers.BigNumber;

describe("LibGeoWebCoordinate", async () => {
  function makeCoord(x: any, y: any) {
    return BigNumber.from(x).shl(32).or(BigNumber.from(y));
  }

  let geoWebCoordinate: Contract;
  let geoWebCoordinatePath: Contract;

  before(async () => {
    const GeoWebCoordinate = await ethers.getContractFactory(
      "LibGeoWebCoordinateTest"
    );
    geoWebCoordinate = await GeoWebCoordinate.deploy();
    await geoWebCoordinate.deployed();

    const GeoWebCoordinatePath = await ethers.getContractFactory(
      "LibGeoWebCoordinatePathTest"
    );
    geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();
    await geoWebCoordinatePath.deployed();
  });

  it("should parse direction from path", async () => {
    const path = BigNumber.from(2)
      .shl(256 - 8)
      .or(BigNumber.from(0b1110));

    const result = await geoWebCoordinatePath.nextDirection(path);

    assert.equal(
      result.direction.toString(),
      BigNumber.from(0b10).toString(),
      "Direction is not correct"
    );

    assert.equal(
      result.nextPath.toString(),
      BigNumber.from(1)
        .shl(256 - 8)
        .or(BigNumber.from(0b11))
        .toString(),
      "Next path is not correct"
    );
  });

  it("should traverse north", async () => {
    const direction = BigNumber.from(0b00);

    const result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result[0].toString(),
      BigNumber.from(0b1).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "16", "I is not correct");
  });

  it("should traverse south", async () => {
    const direction = BigNumber.from(0b01);

    const result = await geoWebCoordinate.traverse(
      makeCoord(0, 1),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(16)
    );

    assert.equal(
      result[0].toString(),
      BigNumber.from(0b0).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");
    assert.equal(result[2].toString(), "0", "Y is not correct");
    assert.equal(result[3].toString(), "0", "I is not correct");
  });

  it("should traverse east", async () => {
    const direction = BigNumber.from(0b10);

    const result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result[0].toString(),
      BigNumber.from(0b1).shl(32).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "1", "I is not correct");
  });

  it("should traverse west", async () => {
    const direction = BigNumber.from(0b11);

    const result = await geoWebCoordinate.traverse(
      makeCoord(1, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(1)
    );

    assert.equal(
      result[0].toString(),
      BigNumber.from(0b0).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "0", "I is not correct");
  });

  it("should traverse north into new word", async () => {
    const direction = BigNumber.from(0b00);

    const result = await geoWebCoordinate.traverse(
      makeCoord(8, 15),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(248)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(8, 16).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "1", "Y is not correct");

    assert.equal(result[3].toString(), "8", "I is not correct");
  });

  it("should traverse south into new word", async () => {
    const direction = BigNumber.from(0b01);

    const result = await geoWebCoordinate.traverse(
      makeCoord(8, 16),
      direction,
      BigNumber.from(0),
      BigNumber.from(1),
      BigNumber.from(8)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(8, 15).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "248", "I is not correct");
  });

  it("should traverse east into new word", async () => {
    const direction = BigNumber.from(0b10);

    const result = await geoWebCoordinate.traverse(
      makeCoord(15, 8),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(143)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(16, 8).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "1", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "128", "I is not correct");
  });

  it("should traverse west into new word", async () => {
    const direction = BigNumber.from(0b11);

    const result = await geoWebCoordinate.traverse(
      makeCoord(16, 8),
      direction,
      BigNumber.from(1),
      BigNumber.from(0),
      BigNumber.from(128)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(15, 8).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "143", "I is not correct");
  });

  it("should not traverse too far north", async () => {
    const direction = BigNumber.from(0b00);

    let err;
    try {
      await geoWebCoordinate.traverse(
        makeCoord(0, 2 ** 18 - 1),
        direction,
        BigNumber.from(0),
        BigNumber.from((2 ** 18 - 1) / 16),
        BigNumber.from(240)
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not traverse too far south", async () => {
    const direction = BigNumber.from(0b01);

    let err;
    try {
      await geoWebCoordinate.traverse(
        makeCoord(0, 0),
        direction,
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0)
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should traverse meridian east -> west", async () => {
    const direction = BigNumber.from(0b10);

    const max_x = await geoWebCoordinate.MAX_X();

    const result = await geoWebCoordinate.traverse(
      makeCoord(max_x, 0),
      direction,
      BigNumber.from(Math.floor(max_x / 16)),
      BigNumber.from(0),
      BigNumber.from(15)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(0, 0).toString(),
      "Destination is not correct"
    );

    assert.equal(result[1].toString(), "0", "X is not correct");

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "0", "I is not correct");
  });

  it("should traverse meridian west -> east", async () => {
    const direction = BigNumber.from(0b11);

    const max_x = await geoWebCoordinate.MAX_X();

    const result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result[0].toString(),
      makeCoord(max_x, 0).toString(),
      "Destination is not correct"
    );

    assert.equal(
      result[1].toString(),
      BigNumber.from(Math.floor(max_x / 16)).toString(),
      "X is not correct"
    );

    assert.equal(result[2].toString(), "0", "Y is not correct");

    assert.equal(result[3].toString(), "15", "I is not correct");
  });

  it("should convert to a word index", async () => {
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    const result = await geoWebCoordinate.toWordIndex(coord);

    assert.equal(
      result.iX.toString(),
      BigNumber.from(0).toString(),
      "X coord is incorrect"
    );

    assert.equal(
      result.iY.toString(),
      BigNumber.from(2).toString(),
      "Y coord is incorrect"
    );

    assert.equal(
      result.i.toString(),
      BigNumber.from(20).toString(),
      "Index is incorrect"
    );
  });

  it("should convert to a word index", async () => {
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    const result = await geoWebCoordinate.toWordIndex(coord);

    assert.equal(
      result.iX.toString(),
      BigNumber.from(0).toString(),
      "X coord is incorrect"
    );

    assert.equal(
      result.iY.toString(),
      BigNumber.from(2).toString(),
      "Y coord is incorrect"
    );

    assert.equal(
      result.i.toString(),
      BigNumber.from(20).toString(),
      "Index is incorrect"
    );
  });
});
