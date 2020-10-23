const GeoWebParcel = artifacts.require("GeoWebParcel");
const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");
const BN = require('bn.js');

function makePathPrefix(length) {
    return new BN(length).shln(256-8)
}

async function traverseSingle() {
    let gwCoor = await GeoWebCoordinate.deployed();

    let direction = (new BN('00', 2))

    let gas = await gwCoor.traverse.estimateGas(new BN('0', 2), direction, new BN('0', 2), new BN('0', 2), new BN(0))

    console.log(`Estimated gas for single traverse: ${gas-21000}`)
}

async function parseDirection() {
    let gwCoor = await GeoWebCoordinatePath.deployed();

    let path = (new BN(2)).shln(256-8).or(new BN('1110', 2))

    let gas = await gwCoor.nextDirection.estimateGas(path)

    console.log(`Estimated gas for parsing direction: ${gas-21000}`)
}

async function wordIndex() {
    let gwCoor = await GeoWebCoordinate.deployed();

    // Global(4, 33) -> Index(0, 2), Local(4, 1)
    let coord = (new BN(4)).shln(32).or(new BN(33))

    let gas = await gwCoor.toWordIndex.estimateGas(coord)

    console.log(`Estimated gas for word index: ${gas-21000}`)
}


async function mintSingleCoordinate() {
    let GW = await GeoWebParcel.deployed()
    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (new BN(160000)).shln(32).or(new BN(17))

    let gas = await GW.mintLandParcel.estimateGas(coord, [new BN(0)])

    console.log(`Estimated gas for single coordinate mint: ${gas}`)
}

async function mintPath(count) {
    let GW = await GeoWebParcel.deployed()
    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (new BN(160000)).shln(32).or(new BN(17))

    let gas = await GW.mintLandParcel.estimateGas(coord, [makePathPrefix(count)])

    console.log(`Estimated gas for ${count} path mint: ${gas}`)
}

async function mintSingleWord(count) {
    let GW = await GeoWebParcel.deployed()
    let GWC = await GeoWebCoordinate.deployed()
    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (new BN(160000)).shln(32).or(new BN(0))

    var paths = []
    var path = new BN(0)
    for (let i = 1; i < count; i++) {
        var direction
        if (i % 16 == 0) {
            // North
            direction = new BN('00', 2)
        } else if (Math.floor(i / 16) % 2 == 0) {
            // East
            direction = new BN('10', 2)
        } else {
            // West
            direction = new BN('11', 2)
        }
        path = direction.shln(i*2).or(path.shrn(2))

        if (i % 124 == 0) {
            paths.push(makePathPrefix(124).or(path))
            path = new BN(0)
        }
    }
    
    paths.push(makePathPrefix((count%124)-1).or(path))
    let gas = await GW.mintLandParcel.estimateGas(coord, paths)

    console.log(`Estimated gas for 1 word mint of ${count} coordinates: ${gas}`)
}

async function mintMultipleWord(count) {
    let GW = await GeoWebParcel.deployed()
    
    // Global(159999, 15) -> Index(99999, 15), Local(15, 15)
    let coord = (new BN(159999)).shln(32).or(new BN(15))

    var paths = []
    var path = new BN(0)
    for (let i = 1; i < count; i++) {
        var direction
        if (i % 16 == 0) {
            // North
            direction = new BN('00', 2)
        } else if (Math.floor(i / 16) % 2 == 0) {
            // East
            direction = new BN('10', 2)
        } else {
            // West
            direction = new BN('11', 2)
        }
        path = direction.shln(i*2).or(path.shrn(2))

        if (i % 124 == 0) {
            paths.push(makePathPrefix(124).or(path))
            path = new BN(0)
        }
    }
    
    paths.push(makePathPrefix((count%124)-1).or(path))
    let gas = await GW.mintLandParcel.estimateGas(coord, paths)

    console.log(`Estimated gas for 4 word mint of ${count} coordinates: ${gas}`)
}

async function r() {
    await traverseSingle()
    await parseDirection()
    await wordIndex()
    await mintSingleCoordinate()
    await mintPath(1)
    await mintPath(2)
    await mintSingleWord(10)
    await mintMultipleWord(10)
    await mintSingleWord(100)
    await mintMultipleWord(100)
    await mintSingleWord(1000)
    await mintMultipleWord(1000)
}

module.exports = function(callback) {
    r().then(() => callback()).catch(error => callback(error))
}