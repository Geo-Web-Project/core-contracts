import BN from "bn.js";
import { BigNumber, ethers } from "ethers";
import { task, types } from "hardhat/config";
const GeoWebCoordinate = require("js-geo-web-coordinate");

function toBN(value: BigNumber): BN {
  const hex = BigNumber.from(value).toHexString();
  if (hex[0] === "-") {
    return new BN("-" + hex.substring(3), 16);
  }
  return new BN(hex.substring(2), 16);
}

async function mintSquare(dim: number, GW: ethers.Contract) {
  // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
  const coord1 = BigNumber.from(0).shl(32).or(BigNumber.from(0));
  const coord2 = BigNumber.from(0 + dim)
    .shl(32)
    .or(BigNumber.from(dim));

  const paths = GeoWebCoordinate.make_rect_path(toBN(coord1), toBN(coord2)).map(
    (v: BN) => {
      return BigNumber.from(v.toString(10));
    }
  );

  const response = await GW.build(coord1, paths);
  const receipt = await response.wait();

  console.log(
    `Transaction of ${dim}x${dim} (${
      dim * dim
    }) coordinates: https://kovan-optimistic.etherscan.io/tx/${
      receipt.transactionHash
    }`
  );
}

task("example:claim")
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

      await mintSquare(40, GW);
    }
  );
