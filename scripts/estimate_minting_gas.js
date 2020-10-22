const GeoWebParcel = artifacts.require("GeoWebParcel");
const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");
const BN = require('bn.js');

function makePathPrefix(length) {
    return new BN(length).shln(256-8)
}

async function mintSingleCoordinate() {
    let GW = await GeoWebParcel.deployed()
    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (new BN(160000)).shln(32).or(new BN(17))

    let gas = await GW.mintLandParcel.estimateGas(coord, [new BN(0)])

    console.log(`Estimated gas for single coordinate mint: ${gas}`)
}

async function mintSingleWord() {
    let GW = await GeoWebParcel.deployed()
    let GWC = await GeoWebCoordinate.deployed()
    
    // Global(160000, 17) -> Index(100000, 1), Local(0, 1)
    let coord = (new BN(160000)).shln(32).or(new BN(0))

    var path = new BN(0)
    for (let i = 1; i < 100; i++) {
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
    }
    let gas = await GW.mintLandParcel.estimateGas(coord, [makePathPrefix(99).or(path)])

    console.log(`Estimated gas for 1 word mint of 100 coordinates: ${gas}`)
}

async function mintMultipleWord() {
    let GW = await GeoWebParcel.deployed()
    
    // Global(159999, 15) -> Index(99999, 15), Local(15, 15)
    let coord = (new BN(159999)).shln(32).or(new BN(15))

    var path = new BN(0)
    for (let i = 1; i < 100; i++) {
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
    }
    let gas = await GW.mintLandParcel.estimateGas(coord, [makePathPrefix(99).or(path)])

    console.log(`Estimated gas for 4 word mint of 100 coordinates: ${gas}`)
}

async function r() {
    await mintSingleCoordinate()
    await mintSingleWord()
    await mintMultipleWord()
}

module.exports = function(callback) {
    r().then(() => callback()).catch(error => callback(error))
}