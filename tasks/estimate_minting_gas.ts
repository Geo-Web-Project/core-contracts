import { ethers } from "ethers";
import { task, types } from "hardhat/config";
import { Provider, Wallet } from "zksync-web3";
const BigNumber = ethers.BigNumber;

function makePathPrefix(length: any) {
    return BigNumber.from(length).shl(256-8)
}

function makeCoord(x: number, y: number) {
    return BigNumber.from(x).shl(32).or(BigNumber.from(y));
  }

async function traverseSingle(wallet: Wallet, gwCoor: ethers.Contract) {
    let direction = BigNumber.from(0b00);

    let gas = await gwCoor.connect(wallet).estimateGas.traverse(
        makeCoord(0, 0),
        direction,
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0)
    );

    console.log(`Estimated gas for single traverse: ${gas}`)
}

async function parseDirection(gwCoorPath: ethers.Contract) {
    let path = (BigNumber.from(2)).shl(256-8).or(BigNumber.from(0b1110))

    let gas = await gwCoorPath.estimateGas.nextDirection(path)

    console.log(`Estimated gas for parsing direction: ${gas}`)
}

async function wordIndex(wallet: Wallet, gwCoor: ethers.Contract) {
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = (BigNumber.from(4)).shl(32).or(BigNumber.from(33))

    let gas = await gwCoor.connect(wallet).estimateGas.toWordIndex(coord)

    console.log(`Estimated gas for word index: ${gas}`)
}


async function buildSingleCoordinate(wallet: Wallet, GW: ethers.Contract) {    
    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    let gas = await GW.connect(wallet).estimateGas.build(coord, [BigNumber.from(0)])

    console.log(`Estimated gas for single coordinate build: ${gas}`)
}

async function mintPath(count: any, GW: ethers.Contract) {    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (BigNumber.from(160000)).shl(32).or(BigNumber.from(17))

    let gas = await GW.estimateGas.mintLandParcel(coord, [makePathPrefix(count)])

    console.log(`Estimated gas for ${count} path mint: ${gas}`)
}

async function mintSingleWord(count: any, GW: ethers.Contract) {    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (BigNumber.from(160000)).shl(32).or(BigNumber.from(0))

    var paths = []
    var path = BigNumber.from(0)
    for (let i = 1; i < count; i++) {
        var direction
        if (i % 16 == 0) {
            // North
            direction = BigNumber.from(0b00)
        } else if (Math.floor(i / 16) % 2 == 0) {
            // East
            direction = BigNumber.from(0b10)
        } else {
            // West
            direction = BigNumber.from(0b11)
        }
        path = direction.shl(i*2).or(path.shr(2))

        if (i % 124 == 0) {
            paths.push(makePathPrefix(124).or(path))
            path = BigNumber.from(0)
        }
    }
    
    paths.push(makePathPrefix((count%124)-1).or(path))
    let gas = await GW.estimateGas.mintLandParcel(coord, paths)

    console.log(`Estimated gas for 1 word mint of ${count} coordinates: ${gas}`)
}

async function mintMultipleWord(count: any, GW: ethers.Contract) {    
    // Global(159999, 15) -> Index(99999, 15), Local(15, 15)
    let coord = (BigNumber.from(159999)).shl(32).or(BigNumber.from(15))

    var paths = []
    var path = BigNumber.from(0)
    for (let i = 1; i < count; i++) {
        var direction
        if (i % 16 == 0) {
            // North
            direction = BigNumber.from(0b00)
        } else if (Math.floor(i / 16) % 2 == 0) {
            // East
            direction = BigNumber.from(0b10)
        } else {
            // West
            direction = BigNumber.from(0b11)
        }
        path = direction.shl(i*2).or(path.shr(2))

        if (i % 124 == 0) {
            paths.push(makePathPrefix(124).or(path))
            path = BigNumber.from(0)
        }
    }
    
    paths.push(makePathPrefix((count%124)-1).or(path))
    let gas = await GW.estimateGas.mintLandParcel(coord, paths)

    console.log(`Estimated gas for 4 word mint of ${count} coordinates: ${gas}`)
}

task("measure:parcel-gas")
  .addParam("gwCoorAddress", "GeoWebCoordinate contract address")
  .addParam("gwCoorPathAddress", "GeoWebCoordinatePath contract address")
  .addParam("geoWebParcelAddress", "GeoWebParcel contract address")
  .setAction(async ({ gwCoorAddress, gwCoorPathAddress, geoWebParcelAddress }: { gwCoorAddress: string, gwCoorPathAddress: string, geoWebParcelAddress: string }, hre) => {
    const provider = new Provider(hre.config.zkSyncDeploy.zkSyncNetwork);
    hre.ethers.provider = provider;

    const ethProvider = ethers.getDefaultProvider("rinkeby");

    const wallet = new Wallet(process.env.DEV_PRIVATE_KEY!, provider, ethProvider);

    const gwCoor = await hre.ethers.getContractAt("GeoWebCoordinate", gwCoorAddress);
    const gwCoorPath = await hre.ethers.getContractAt("GeoWebCoordinatePath", gwCoorAddress);
    const GW = await hre.ethers.getContractAt("GeoWebParcel", geoWebParcelAddress);

    const buildRole = await GW.BUILD_ROLE();
    
    const result = await GW.connect(wallet).grantRole(buildRole, wallet.address, {gasLimit: 100000});
    const receipt = await result.wait();

    console.log(receipt)

    await traverseSingle(wallet, gwCoor)
    // await parseDirection(gwCoorPath)
    await wordIndex(wallet, gwCoor)
    await buildSingleCoordinate(wallet, GW)
    // await mintPath(1, GW)
    // await mintPath(2, GW)
    // await mintSingleWord(10, GW)
    // await mintMultipleWord(10, GW)
    // await mintSingleWord(100, GW)
    // await mintMultipleWord(100, GW)
    // await mintSingleWord(1000, GW)
    // await mintMultipleWord(1000, GW)
  });