const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");

module.exports = function (deployer) {
    deployer.deploy(GeoWebCoordinate);
};
