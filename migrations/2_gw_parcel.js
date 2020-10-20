const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");
const GeoWebParcel = artifacts.require("GeoWebParcel");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(GeoWebCoordinate);
    deployer.deploy(GeoWebCoordinatePath);

    deployer.link(GeoWebCoordinate, GeoWebParcel);
    deployer.link(GeoWebCoordinatePath, GeoWebParcel);
    deployer.deploy(GeoWebParcel, accounts[0]);
};
