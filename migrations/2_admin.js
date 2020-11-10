const GeoWebAdmin = artifacts.require("GeoWebAdmin");

module.exports = async function (deployer, network, accounts) {
  return deployer.deploy(GeoWebAdmin);
};
