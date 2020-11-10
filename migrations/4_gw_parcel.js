const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");
const GeoWebParcel = artifacts.require("GeoWebParcel");
const GeoWebAdmin = artifacts.require("GeoWebAdmin");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(GeoWebCoordinate);
  deployer.deploy(GeoWebCoordinatePath);

  deployer.link(GeoWebCoordinate, GeoWebParcel);
  deployer.link(GeoWebCoordinatePath, GeoWebParcel);

  return GeoWebAdmin.deployed().then(async (adminContract) => {
    let parcelContract = await deployer.deploy(
      GeoWebParcel,
      adminContract.address
    );

    await adminContract.setParcelContract(parcelContract.address);
  });
};
