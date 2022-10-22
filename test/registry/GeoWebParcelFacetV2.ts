import { assert, use } from "chai";
import { deployments } from "hardhat";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { deployDiamond } from "../../scripts/deploy";

use(solidity);

describe("GeoWebParcelV2", async () => {
  const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }) => {
      await deployments.fixture();

      const { diamondAdmin } = await getNamedAccounts();
      const diamond = await deployDiamond("RegistryDiamond", {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ["GeoWebParcelFacet", "TestableGeoWebParcelFacetV2"],
      });

      const geoWebParcelV1 = await ethers.getContractAt(
        `GeoWebParcelFacet`,
        diamond.address
      );

      const geoWebParcel = await ethers.getContractAt(
        `TestableGeoWebParcelFacetV2`,
        diamond.address
      );

      const GeoWebCoordinate = await ethers.getContractFactory(
        "LibGeoWebCoordinateV2"
      );
      const geoWebCoordinate = await GeoWebCoordinate.deploy();
      await geoWebCoordinate.deployed();

      const max_x = await geoWebCoordinate.MAX_X();
      const max_y = await geoWebCoordinate.MAX_Y();

      return {
        geoWebParcelV1,
        geoWebParcel,
        max_x,
        max_y,
      };
    }
  );

  it("should build a parcel of a single coordinate", async () => {
    const { geoWebParcel, geoWebParcelV1 } = await setupTest();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    const buildTx = await geoWebParcel.build([coord, 1, 1]);

    const buildResult = await buildTx.wait();

    const result = await geoWebParcelV1.availabilityIndex(0, 2);

    assert.equal(
      result.toString(),
      BigNumber.from(1).shl(20).toString(),
      "Incorrect availability"
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcelV2(parcelId);
    assert.equal(
      parcel.swCoordinate.toString(),
      coord.toString(),
      "Stored coordinate is incorrect"
    );
  });

  it("should build parcel within one word", async () => {
    const { geoWebParcel, geoWebParcelV1 } = await setupTest();

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    const buildTx = await geoWebParcel.build([coord, 2, 3]);

    const buildResult = await buildTx.wait();

    const result = await geoWebParcelV1.availabilityIndex(0, 1);

    assert.equal(
      result.toString(),
      BigNumber.from(1)
        .shl(16 * 1 + 4)
        .or(BigNumber.from(1).shl(16 * 1 + 5))
        .or(BigNumber.from(1).shl(16 * 2 + 5))
        .or(BigNumber.from(1).shl(16 * 2 + 4))
        .or(BigNumber.from(1).shl(16 * 3 + 4))
        .or(BigNumber.from(1).shl(16 * 3 + 5))
        .toString(),
      "Incorrect availability"
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcelV2(parcelId);
    assert.equal(
      parcel.swCoordinate.toString(),
      coord.toString(),
      "Stored coordinate is incorrect"
    );
  });

  it("should build parcel that spans multiple words", async () => {
    const { geoWebParcel, geoWebParcelV1 } = await setupTest();

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    const coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    // East -> Index(1, 0), Local(0, 1)
    const buildTx = await geoWebParcel.build([coord, 2, 2]);

    const buildResult = await buildTx.wait();

    const result0 = await geoWebParcelV1.availabilityIndex(0, 0);
    const result1 = await geoWebParcelV1.availabilityIndex(1, 0);

    assert.equal(
      result0.toString(),
      BigNumber.from(1)
        .shl(16 * 1 + 15)
        .or(BigNumber.from(1).shl(16 * 2 + 15))
        .toString(),
      "Incorrect availability for index 0"
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1)
        .shl(16 * 1)
        .or(BigNumber.from(1).shl(16 * 2))
        .toString(),
      "Incorrect availability for index 1"
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcelV2(parcelId);
    assert.equal(
      parcel.swCoordinate.toString(),
      coord.toString(),
      "Stored coordinate is incorrect"
    );
  });

  it("should build parcel that crosses the meridian", async () => {
    const { geoWebParcel, max_x, geoWebParcelV1 } = await setupTest();

    // Global(MAX, 160) -> Index(MAX/16, 10), Local(15, 0)
    const coord = BigNumber.from(max_x).shl(32).or(BigNumber.from(160));

    // East -> Index(0, 10), Local(0, 0)
    const buildTx = await geoWebParcel.build([coord, 2, 1]);
    const buildResult = await buildTx.wait();

    const result0 = await geoWebParcelV1.availabilityIndex(0, 10);
    const result1 = await geoWebParcelV1.availabilityIndex(
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
    const parcel = await geoWebParcel.getLandParcelV2(parcelId);
    assert.equal(
      parcel.swCoordinate.toString(),
      coord.toString(),
      "Stored coordinate is incorrect"
    );
  });

  it("should not build parcel that overlaps with a existing parcel", async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    await geoWebParcel.build([coord, 1, 1]);

    let err;
    try {
      await geoWebParcel.build([coord, 1, 1]);
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
    const { geoWebParcel, max_y } = await setupTest();

    // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
    const coord = BigNumber.from(16000).shl(32).or(max_y);

    let err;
    try {
      // North
      await geoWebParcel.build([coord, 1, 2]);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should not build parcel with 0 lat dimension", async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // North
      await geoWebParcel.build([coord, 1, 0]);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Latitude dimension out of bounds"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel with 0 lng dimension", async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // North
      await geoWebParcel.build([coord, 0, 1]);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Longitude dimension out of bounds"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel with too large lat dimension", async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // North
      await geoWebParcel.build([coord, 1, 201]);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Latitude dimension out of bounds"),
        "Expected an error but did not get one"
      );
    }
  });

  it("should not build parcel with too large lng dimension", async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // North
      await geoWebParcel.build([coord, 201, 1]);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, "Expected an error but did not get one");
    if (err instanceof Error) {
      assert(
        err.message.includes("Longitude dimension out of bounds"),
        "Expected an error but did not get one"
      );
    }
  });
});
