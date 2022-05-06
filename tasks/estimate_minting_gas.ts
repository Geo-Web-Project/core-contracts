import { ethers } from "ethers";
import { task, types } from "hardhat/config";
const BigNumber = ethers.BigNumber;

function makePathPrefix(length: any) {
  return BigNumber.from(length).shl(256 - 8);
}

function makeCoord(x: number, y: number) {
  return BigNumber.from(x).shl(32).or(BigNumber.from(y));
}

async function traverseSingle(gwCoor: ethers.Contract) {
  let direction = BigNumber.from(0b00);

  let gas = await gwCoor.estimateGas.traverse(
    makeCoord(0, 0),
    direction,
    BigNumber.from(0),
    BigNumber.from(0),
    BigNumber.from(0)
  );

  console.log(`Estimated gas for single traverse: ${gas}`);
}

async function parseDirection(gwCoorPath: ethers.Contract) {
  let path = BigNumber.from(2)
    .shl(256 - 8)
    .or(BigNumber.from(0b1110));

  let gas = await gwCoorPath.estimateGas.nextDirection(path);

  console.log(`Estimated gas for parsing direction: ${gas}`);
}

async function wordIndex(gwCoor: ethers.Contract) {
  // Global(4, 33) -> Index(0, 2), Local(4, 1)
  let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

  let gas = await gwCoor.estimateGas.toWordIndex(coord);

  console.log(`Estimated gas for word index: ${gas}`);
}

async function buildSingleCoordinate(GW: ethers.Contract) {
  // Global(4, 33) -> Index(0, 2), Local(4, 1)
  let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

  let gas = await GW.estimateGas.build(coord, [BigNumber.from(0)]);

  console.log(`Estimated gas for single coordinate build: ${gas}`);
}

async function mintPath(count: any, GW: ethers.Contract) {
  // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
  let coord = BigNumber.from(160000).shl(32).or(BigNumber.from(17));

  let gas = await GW.estimateGas.build(coord, [makePathPrefix(count)]);

  console.log(`Estimated gas for ${count} path mint: ${gas}`);
}

async function mintSingleWord(count: any, GW: ethers.Contract) {
  // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
  let coord = BigNumber.from(160000).shl(32).or(BigNumber.from(0));

  var paths = [];
  var path = BigNumber.from(0);
  for (let i = 1; i < count; i++) {
    var direction;
    if (i % 16 == 0) {
      // North
      direction = BigNumber.from(0b00);
    } else if (Math.floor(i / 16) % 2 == 0) {
      // East
      direction = BigNumber.from(0b10);
    } else {
      // West
      direction = BigNumber.from(0b11);
    }
    path = direction.shl(i * 2).or(path.shr(2));

    if (i % 124 == 0) {
      paths.push(makePathPrefix(124).or(path));
      path = BigNumber.from(0);
    }
  }

  paths.push(makePathPrefix((count % 124) - 1).or(path));
  let gas = await GW.estimateGas.build(coord, paths);

  console.log(`Estimated gas for 1 word mint of ${count} coordinates: ${gas}`);
}

async function mintMultipleWord(count: any, GW: ethers.Contract) {
  // Global(159999, 15) -> Index(99999, 15), Local(15, 15)
  let coord = BigNumber.from(159999).shl(32).or(BigNumber.from(15));

  var paths = [];
  var path = BigNumber.from(0);
  for (let i = 1; i < count; i++) {
    var direction;
    if (i % 16 == 0) {
      // North
      direction = BigNumber.from(0b00);
    } else if (Math.floor(i / 16) % 2 == 0) {
      // East
      direction = BigNumber.from(0b10);
    } else {
      // West
      direction = BigNumber.from(0b11);
    }
    path = direction.shl(i * 2).or(path.shr(2));

    if (i % 124 == 0) {
      paths.push(makePathPrefix(124).or(path));
      path = BigNumber.from(0);
    }
  }

  paths.push(makePathPrefix((count % 124) - 1).or(path));
  let gas = await GW.estimateGas.build(coord, paths);

  console.log(`Estimated gas for 4 word mint of ${count} coordinates: ${gas}`);
}

task("measure:parcel-gas")
  .addParam("geoWebCoordinate", "GeoWebCoordinate contract address")
  .addParam("geoWebCoordinatePath", "GeoWebCoordinatePath contract address")
  .addParam("geoWebParcel", "GeoWebParcel contract address")
  .setAction(
    async (
      {
        geoWebCoordinate,
        geoWebCoordinatePath,
        geoWebParcel,
      }: {
        geoWebCoordinate: string;
        geoWebCoordinatePath: string;
        geoWebParcel: string;
      },
      hre
    ) => {
      const [admin] = await hre.ethers.getSigners();

      const gwCoor = await hre.ethers.getContractAt(
        "GeoWebCoordinate",
        geoWebCoordinate
      );
      const gwCoorPath = await hre.ethers.getContractAt(
        "GeoWebCoordinatePath",
        geoWebCoordinatePath
      );
      const GW = await hre.ethers.getContractAt("GeoWebParcel", geoWebParcel);

      const buildRole = await GW.BUILD_ROLE();

      const result = await GW.grantRole(buildRole, admin.address);
      await result.wait();

      await traverseSingle(gwCoor);
      await parseDirection(gwCoorPath);
      await wordIndex(gwCoor);
      await buildSingleCoordinate(GW);
      await mintPath(1, GW);
      await mintPath(2, GW);
      await mintSingleWord(10, GW);
      await mintMultipleWord(10, GW);
      await mintSingleWord(100, GW);
      await mintMultipleWord(100, GW);
      //   await mintSingleWord(1000, GW);
      //   await mintMultipleWord(1000, GW);
    }
  );
