import BN from "bn.js";
import { BigNumber, ethers } from "ethers";
import { task, types } from "hardhat/config";
const GeoWebCoordinate = require("js-geo-web-coordinate");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

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

async function rateToPurchasePrice(
  paramsStore: ethers.Contract,
  rate: BigNumber
) {
  const perSecondFeeNumerator = await paramsStore.getPerSecondFeeNumerator();
  const perSecondFeeDenominator =
    await paramsStore.getPerSecondFeeDenominator();

  return rate.mul(perSecondFeeDenominator).div(perSecondFeeNumerator);
}

async function traverseSingle(gwCoor: ethers.Contract) {
  const direction = BigNumber.from(0b00);

  const gas = await gwCoor.estimateGas.traverse(
    makeCoord(0, 0),
    direction,
    BigNumber.from(0),
    BigNumber.from(0),
    BigNumber.from(0)
  );

  console.log(`Estimated gas for single traverse: ${gas}`);
}

async function parseDirection(gwCoorPath: ethers.Contract) {
  const path = BigNumber.from(2)
    .shl(256 - 8)
    .or(BigNumber.from(0b1110));

  const gas = await gwCoorPath.estimateGas.nextDirection(path);

  console.log(`Estimated gas for parsing direction: ${gas}`);
}

async function wordIndex(gwCoor: ethers.Contract) {
  // Global(4, 33) -> Index(0, 2), Local(4, 1)
  const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

  const gas = await gwCoor.estimateGas.toWordIndex(coord);

  console.log(`Estimated gas for word index: ${gas}`);
}

async function buildSingleCoordinate(GW: ethers.Contract) {
  // Global(4, 33) -> Index(0, 2), Local(4, 1)
  const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

  const gas = await GW.estimateGas.build(coord, [BigNumber.from(0)]);

  console.log(`Estimated gas for single coordinate build: ${gas}`);
}

async function mintPath(count: any, registryDiamond: ethers.Contract) {
  // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
  const coord = BigNumber.from(160000).shl(32).or(BigNumber.from(17));

  const contributionRate = ethers.utils
    .parseEther("9")
    .div(365 * 24 * 60 * 60 * 10);
  const forSalePrice = await rateToPurchasePrice(
    registryDiamond,
    contributionRate
  );

  const gas = await registryDiamond.estimateGas.claim(
    contributionRate,
    forSalePrice,
    coord,
    [makePathPrefix(count)]
  );

  console.log(`Estimated gas for ${count} path mint: ${gas}`);
}

async function mintSquare(dim: number, registryDiamond: ethers.Contract) {
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

  const contributionRate = ethers.utils
    .parseEther("9")
    .div(365 * 24 * 60 * 60 * 10);
  const forSalePrice = await rateToPurchasePrice(
    registryDiamond,
    contributionRate
  );

  const gas = await registryDiamond.estimateGas.claim(
    contributionRate,
    forSalePrice,
    coord1,
    paths
  );

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

task("measure:parcel-gas").setAction(async ({ a = {} }, hre) => {
  const { getNamedAccounts } = hre;

  const { diamondAdmin } = await getNamedAccounts();

  const registryDiamond: ethers.Contract = await hre.ethers.getContract(
    "RegistryDiamond"
  );

  const sf: Framework = await Framework.create({
    chainId: hre.network.config.chainId!,
    provider: hre.ethers.provider,
  });
  const ethx: SuperToken = await sf.loadSuperToken("ETHx");

  // Approve flow creation
  const nextAddress = await registryDiamond.getNextProxyAddress(diamondAdmin);
  const flowData = await sf.cfaV1.getFlowOperatorData({
    superToken: ethx.address,
    flowOperator: nextAddress,
    sender: diamondAdmin,
    providerOrSigner: await hre.ethers.getSigner(diamondAdmin),
  });
  console.log(flowData);

  if (flowData.permissions !== "7") {
    const op = await sf.cfaV1.authorizeFlowOperatorWithFullControl({
      superToken: ethx.address,
      flowOperator: nextAddress,
    });
    const resp = await op.exec(await hre.ethers.getSigner(diamondAdmin));
    await resp.wait();
  }

  // await traverseSingle(gwCoor);
  // await parseDirection(gwCoorPath);
  // await wordIndex(gwCoor);
  // await buildSingleCoordinate(GW);
  await mintPath(1, registryDiamond);
  await mintPath(2, registryDiamond);
  await mintSquare(Math.sqrt(16), registryDiamond);
  await mintSquare(Math.sqrt(64), registryDiamond);
  await mintSquare(Math.floor(Math.sqrt(26)), registryDiamond);
  await mintSquare(Math.floor(Math.sqrt(208)), registryDiamond);
  await mintSquare(Math.floor(Math.sqrt(416)), registryDiamond);
  await mintSquare(Math.floor(Math.sqrt(833)), registryDiamond);
  await mintSquare(Math.floor(Math.sqrt(1666)), registryDiamond);
  await mintSquare(50, registryDiamond);
  await mintSquare(64, registryDiamond);
});
