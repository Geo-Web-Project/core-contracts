const Geohash = artifacts.require("Geohash");

module.exports = function (deployer) {
    deployer.deploy(Geohash);
};
