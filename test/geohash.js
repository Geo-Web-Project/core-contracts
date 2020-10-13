const Geohash = artifacts.require("Geohash");
const geohash_lib = require('ngeohash');

contract("Geohash", async accounts => {
    it("should deinterleave geohash into lat lon", async () => {
        let G = await Geohash.deployed();
        let result = await G.deinterleave(geohash_lib.decode('ww8p1r4t8'));
        console.log(result);
    });
});