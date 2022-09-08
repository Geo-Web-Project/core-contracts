import { assert, expect, use } from 'chai';
import { deployments } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';

use(solidity);

describe('GeoWebParcel', async () => {
  function makePathPrefix(length: any) {
    return BigNumber.from(length).shl(256 - 8);
  }

  const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options) => {
      await deployments.fixture();
      const GeoWebCoordinate = await ethers.getContractFactory(
        'LibGeoWebCoordinate'
      );
      const geoWebCoordinate = await GeoWebCoordinate.deploy();
      await geoWebCoordinate.deployed();

      const max_x = await geoWebCoordinate.MAX_X();
      const max_y = await geoWebCoordinate.MAX_Y();

      const { diamondAdmin } = await getNamedAccounts();
      const { diamond } = deployments;
      await diamond.deploy('GeoWebParcel', {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ['TestableGeoWebParcelFacet'],
      });

      const geoWebParcel = await ethers.getContract(
        'GeoWebParcel',
        diamondAdmin
      );

      return {
        geoWebParcel,
        max_x,
        max_y,
      };
    }
  );

  it('should build and destroy a parcel of a single coordinate', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    const buildTx = await geoWebParcel.build(coord, [BigNumber.from(0)]);

    const buildResult = await buildTx.wait();

    const result = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result.toString(),
      BigNumber.from(1).shl(20).toString(),
      'Incorrect availability'
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      'Stored base coordinate is incorrect'
    );

    await geoWebParcel.destroy(parcelId);

    const result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });

  it('should build and destroy parcel within one word', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    // North, North, West
    const buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(3).or(BigNumber.from(0b110000)),
    ]);

    const buildResult = await buildTx.wait();

    const result = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result.toString(),
      BigNumber.from(1)
        .shl(20)
        .or(BigNumber.from(1).shl(36))
        .or(BigNumber.from(1).shl(52))
        .or(BigNumber.from(1).shl(51))
        .toString(),
      'Incorrect availability'
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      'Stored base coordinate is incorrect'
    );

    await geoWebParcel.destroy(parcelId);

    const result1 = await geoWebParcel.availabilityIndex(0, 1);

    assert.equal(
      result1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });

  it('should build and destroy parcel that spans multiple words', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    const coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    // East, North
    // East -> Index(1, 0), Local(0, 1)
    const buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(2).or(BigNumber.from(0b0010)),
    ]);

    const buildResult = await buildTx.wait();

    const result0 = await geoWebParcel.availabilityIndex(0, 0);
    const result1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0.toString(),
      BigNumber.from(1).shl(31).toString(),
      'Incorrect availability for index 0'
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(16).or(BigNumber.from(1).shl(32)).toString(),
      'Incorrect availability for index 1'
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      'Stored base coordinate is incorrect'
    );

    await geoWebParcel.destroy(parcelId);

    const result0_1 = await geoWebParcel.availabilityIndex(0, 0);
    const result1_1 = await geoWebParcel.availabilityIndex(1, 0);

    assert.equal(
      result0_1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );
    assert.equal(
      result1_1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });

  it('should build and destroy parcel with a long path', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(511, 0) -> Index(31, 0), Local(15, 0)
    const coord = BigNumber.from(511).shl(32).or(BigNumber.from(0));

    // West 124 times
    const path1 = makePathPrefix(124).or(
      BigNumber.from(2)
        .shl(248 - 1)
        .sub(BigNumber.from(1))
    );
    // West 3 times
    const path2 = makePathPrefix(3).or(BigNumber.from(0b111111));
    const buildTx = await geoWebParcel.build(coord, [path1, path2]);
    const buildResult = await buildTx.wait();

    for (let i = 0; i < 128 / 16; i++) {
      const result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(2).shl(15).sub(BigNumber.from(1)).toString(),
        'Incorrect availability for ' + i
      );
    }

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      'Stored base coordinate is incorrect'
    );

    await geoWebParcel.destroy(parcelId);

    for (let i = 0; i < 128 / 16; i++) {
      const result = await geoWebParcel.availabilityIndex(31 - i, 0);

      assert.equal(
        result.toString(),
        BigNumber.from(0).toString(),
        'Parcel coordinates were not destroyed'
      );
    }

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });

  it('should build and destroy parcel that crosses the meridian', async () => {
    const { geoWebParcel, max_x } = await setupTest();

    // Global(0, 160) -> Index(0, 10), Local(0, 0)
    const coord = BigNumber.from(0).shl(32).or(BigNumber.from(160));

    // West -> Index(MAX/16, 10), Local(15, 0)
    const buildTx = await geoWebParcel.build(coord, [
      makePathPrefix(1).or(BigNumber.from(0b11)),
    ]);
    const buildResult = await buildTx.wait();

    const result0 = await geoWebParcel.availabilityIndex(0, 10);
    const result1 = await geoWebParcel.availabilityIndex(
      max_x.add(1).div(16).sub(1),
      10
    );

    assert.equal(
      result0.toString(),
      BigNumber.from(1).toString(),
      'Incorrect availability for index 0'
    );

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(15).toString(),
      'Incorrect availability for index 1'
    );

    const parcelId = buildResult.events![0].topics[1];
    const parcel = await geoWebParcel.getLandParcel(parcelId);
    assert.equal(
      parcel.baseCoordinate.toString(),
      coord.toString(),
      'Stored base coordinate is incorrect'
    );

    await geoWebParcel.destroy(parcelId);

    const result0_1 = await geoWebParcel.availabilityIndex(0, 10);
    const result1_1 = await geoWebParcel.availabilityIndex(
      max_x.add(1).div(16).sub(1),
      10
    );
    assert.equal(
      result0_1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );
    assert.equal(
      result1_1.toString(),
      BigNumber.from(0).toString(),
      'Parcel coordinates were not destroyed'
    );

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });

  it('should not build parcel that repeats coordinates', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 17) -> Index(0, 1), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(17));

    let err;
    try {
      // North, North, West, East
      const buildTx = await geoWebParcel.build(coord, [
        makePathPrefix(4).or(BigNumber.from(0b10110000)),
      ]);

      await buildTx.wait();
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, 'Expected an error but did not get one');
    if (err instanceof Error) {
      assert(
        err.message.includes('Coordinate is not available'),
        'Expected an error but did not get one'
      );
    }
  });

  it('should not build parcel that repeats coordinates across multiple words', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(15, 1) -> Index(0, 0), Local(15, 1)
    const coord = BigNumber.from(15).shl(32).or(BigNumber.from(1));

    let err;
    try {
      // East, North, South, West
      // East -> Index(1, 0), Local(0, 1)
      const buildTx = await geoWebParcel.build(coord, [
        makePathPrefix(4).or(BigNumber.from(0b11010010)),
      ]);

      await buildTx.wait();
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, 'Expected an error but did not get one');
    if (err instanceof Error) {
      assert(
        err.message.includes('Coordinate is not available'),
        'Expected an error but did not get one'
      );
    }
  });

  it('should not build parcel that overlaps with a existing parcel', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    await geoWebParcel.build(coord, [BigNumber.from(0)]);

    let err;
    try {
      // North
      await geoWebParcel.build(coord, [BigNumber.from(0)]);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, 'Expected an error but did not get one');
    if (err instanceof Error) {
      assert(
        err.message.includes('Coordinate is not available'),
        'Expected an error but did not get one'
      );
    }
  });

  it('should not build parcel that goes too far north', async () => {
    const { geoWebParcel, max_y } = await setupTest();

    // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
    const coord = BigNumber.from(16000).shl(32).or(max_y);

    let err;
    try {
      // North
      await geoWebParcel.build(coord, [
        makePathPrefix(1).or(BigNumber.from(0b00)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, 'Expected an error but did not get one');
  });

  it('should not build parcel that goes too far south', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // South
      await geoWebParcel.build(coord, [
        makePathPrefix(1).or(BigNumber.from(0b01)),
      ]);
    } catch (error) {
      err = error;
    }

    assert(err, 'Expected an error but did not get one');
  });

  it('should not build parcel with empty path', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
    const coord = BigNumber.from(16000).shl(32).or(BigNumber.from(0));

    let err;
    try {
      // North
      await geoWebParcel.build(coord, []);
    } catch (error) {
      err = error;
    }

    assert(err instanceof Error, 'Expected an error but did not get one');
    if (err instanceof Error) {
      assert(
        err.message.includes('Path must have at least one component'),
        'Expected an error but did not get one'
      );
    }
  });

  it('should only destroy one parcel within a word', async () => {
    const { geoWebParcel } = await setupTest();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    // Global(4, 34) -> Index(0, 2), Local(4, 2)
    const coord1 = BigNumber.from(4).shl(32).or(BigNumber.from(34));

    await geoWebParcel.build(coord, [BigNumber.from(0)]);
    const buildTx = await geoWebParcel.build(coord1, [BigNumber.from(0)]);
    const buildResult = await buildTx.wait();

    const parcelId = buildResult.events![0].topics[1];
    await geoWebParcel.destroy(parcelId);

    const result1 = await geoWebParcel.availabilityIndex(0, 2);

    assert.equal(
      result1.toString(),
      BigNumber.from(1).shl(20).toString(),
      'Parcel coordinates were not destroyed'
    );

    const parcel1 = await geoWebParcel.getLandParcel(parcelId);
    expect(parcel1.baseCoordinate).to.equal(
      0,
      'Parcel was not marked as destroyed'
    );
    expect(parcel1.path, 'Parcel was not marked as destroyed').to.be.empty;
  });
});
