import BN from "bn.js";
import { BigNumber, ethers } from "ethers";
import { task, types } from "hardhat/config";
const GeoWebCoordinate = require("js-geo-web-coordinate");

function makePathPrefix(length: any) {
  return BigNumber.from(length).shl(256 - 8);
}

function makeCoord(x: number, y: number) {
  return BigNumber.from(x).shl(32).or(BigNumber.from(y));
}

function toBN(value: BigNumber): BN {
  const hex = BigNumber.from(value).toHexString();
  if (hex[0] === "-") {
    return new BN("-" + hex.substring(3), 16);
  }
  return new BN(hex.substring(2), 16);
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

async function mintSquare(dim: number, GW: ethers.Contract) {
  // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
  const coord1 = BigNumber.from(160000).shl(32).or(BigNumber.from(0));
  const coord2 = BigNumber.from(160000 + dim)
    .shl(32)
    .or(BigNumber.from(dim));

  const paths = GeoWebCoordinate.make_rect_path(toBN(coord1), toBN(coord2)).map(
    (v: BN) => {
      return BigNumber.from(v.toString(10));
    }
  );

  const gas = await GW.estimateGas.build(coord1, paths);

  console.log(
    `Estimated gas mint of ${dim}x${dim} (${dim * dim}) coordinates: ${gas}`
  );
}

// task("measure:setup")
//   .addParam("geoWebCoordinate", "GeoWebCoordinate contract address")
//   .addParam("geoWebCoordinatePath", "GeoWebCoordinatePath contract address")
//   .addParam("geoWebParcel", "GeoWebParcel contract address")
//   .setAction(
//     async (
//       {
//         geoWebParcel,
//       }: {
//         geoWebParcel: string;
//       },
//       hre
//     ) => {
//       const [admin] = await hre.ethers.getSigners();

//       const GW = await hre.ethers.getContractAt("GeoWebParcel", geoWebParcel);

//       const buildRole = await GW.BUILD_ROLE();

//       const result = await GW.grantRole(buildRole, admin.address);
//       await result.wait();
//     }
//   );

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
      const gwCoor = await hre.ethers.getContractAt(
        "GeoWebCoordinate",
        geoWebCoordinate
      );
      const gwCoorPath = await hre.ethers.getContractAt(
        "GeoWebCoordinatePath",
        geoWebCoordinatePath
      );
      const GW = await hre.ethers.getContractAt("GeoWebParcel", geoWebParcel);

      await traverseSingle(gwCoor);
      await parseDirection(gwCoorPath);
      await wordIndex(gwCoor);
      await buildSingleCoordinate(GW);
      await mintPath(1, GW);
      await mintPath(2, GW);
      await mintSquare(Math.sqrt(16), GW);
      await mintSquare(Math.sqrt(64), GW);
      await mintSquare(Math.floor(Math.sqrt(26)), GW);
      await mintSquare(Math.floor(Math.sqrt(208)), GW);
      await mintSquare(Math.floor(Math.sqrt(416)), GW);
      await mintSquare(Math.floor(Math.sqrt(833)), GW);
      await mintSquare(Math.floor(Math.sqrt(1666)), GW);
      await mintSquare(50, GW);
      await mintSquare(64, GW);
    }
  );
