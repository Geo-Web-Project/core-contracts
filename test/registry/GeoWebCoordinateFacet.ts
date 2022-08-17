import { assert } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";

const BigNumber = ethers.BigNumber;

describe("LibGeoWebCoordinate", async () => {
  function makeCoord(x: any, y: any) {
    return BigNumber.from(x).shl(32).or(BigNumber.from(y));
  }

  let geoWebCoordinate: Contract;
  let geoWebCoordinatePath: Contract;

  before(async () => {
    const GeoWebCoordinate = await ethers.getContractFactory(
      "LibGeoWebCoordinate"
    );
    geoWebCoordinate = await GeoWebCoordinate.deploy();
    await geoWebCoordinate.deployed();

    const GeoWebCoordinatePath = await ethers.getContractFactory(
      "LibGeoWebCoordinatePath"
    );
    geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();
    await geoWebCoordinatePath.deployed();
  });

  it("should parse direction from path", async () => {
    let path = BigNumber.from(2)
      .shl(256 - 8)
      .or(BigNumber.from(0b1110));

    let result = await geoWebCoordinatePath.nextDirection(path);

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
    let direction = BigNumber.from(0b00);

    let result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result.destination.toString(),
      BigNumber.from(0b1).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "16", "I is not correct");
  });

  it("should traverse south", async () => {
    let direction = BigNumber.from(0b01);

    let result = await geoWebCoordinate.traverse(
      makeCoord(0, 1),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(16)
    );

    assert.equal(
      result.destination.toString(),
      BigNumber.from(0b0).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "0", "I is not correct");
  });

  it("should traverse east", async () => {
    let direction = BigNumber.from(0b10);

    let result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result.destination.toString(),
      BigNumber.from(0b1).shl(32).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "1", "I is not correct");
  });

  it("should traverse west", async () => {
    let direction = BigNumber.from(0b11);

    let result = await geoWebCoordinate.traverse(
      makeCoord(1, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(1)
    );

    assert.equal(
      result.destination.toString(),
      BigNumber.from(0b0).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "0", "I is not correct");
  });

  it("should traverse north into new word", async () => {
    let direction = BigNumber.from(0b00);

    let result = await geoWebCoordinate.traverse(
      makeCoord(8, 15),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(248)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(8, 16).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "1", "Y is not correct");

    assert.equal(result.i.toString(), "8", "I is not correct");
  });

  it("should traverse south into new word", async () => {
    let direction = BigNumber.from(0b01);

    let result = await geoWebCoordinate.traverse(
      makeCoord(8, 16),
      direction,
      BigNumber.from(0),
      BigNumber.from(1),
      BigNumber.from(8)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(8, 15).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "248", "I is not correct");
  });

  it("should traverse east into new word", async () => {
    let direction = BigNumber.from(0b10);

    let result = await geoWebCoordinate.traverse(
      makeCoord(15, 8),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(143)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(16, 8).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "1", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "128", "I is not correct");
  });

  it("should traverse west into new word", async () => {
    let direction = BigNumber.from(0b11);

    let result = await geoWebCoordinate.traverse(
      makeCoord(16, 8),
      direction,
      BigNumber.from(1),
      BigNumber.from(0),
      BigNumber.from(128)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(15, 8).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "143", "I is not correct");
  });

  it("should not traverse too far north", async () => {
    let direction = BigNumber.from(0b00);

    var err;
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
    let direction = BigNumber.from(0b01);

    var err;
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
    let direction = BigNumber.from(0b10);

    const max_x = await geoWebCoordinate.MAX_X();

    let result = await geoWebCoordinate.traverse(
      makeCoord(max_x, 0),
      direction,
      BigNumber.from(Math.floor(max_x / 16)),
      BigNumber.from(0),
      BigNumber.from(15)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(0, 0).toString(),
      "Destination is not correct"
    );

    assert.equal(result.i_x.toString(), "0", "X is not correct");

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "0", "I is not correct");
  });

  it("should traverse meridian west -> east", async () => {
    let direction = BigNumber.from(0b11);

    const max_x = await geoWebCoordinate.MAX_X();

    let result = await geoWebCoordinate.traverse(
      makeCoord(0, 0),
      direction,
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0)
    );

    assert.equal(
      result.destination.toString(),
      makeCoord(max_x, 0).toString(),
      "Destination is not correct"
    );

    assert.equal(
      result.i_x.toString(),
      BigNumber.from(Math.floor(max_x / 16)).toString(),
      "X is not correct"
    );

    assert.equal(result.i_y.toString(), "0", "Y is not correct");

    assert.equal(result.i.toString(), "15", "I is not correct");
  });

  it("should convert to a word index", async () => {
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    let result = await geoWebCoordinate.toWordIndex(coord);

    assert.equal(
      result.i_x.toString(),
      BigNumber.from(0).toString(),
      "X coord is incorrect"
    );

    assert.equal(
      result.i_y.toString(),
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
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    let result = await geoWebCoordinate.toWordIndex(coord);

    assert.equal(
      result.i_x.toString(),
      BigNumber.from(0).toString(),
      "X coord is incorrect"
    );

    assert.equal(
      result.i_y.toString(),
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
