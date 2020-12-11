const { upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdmin_v0 = artifacts.require("GeoWebAdmin_v0");

module.exports = async function (deployer) {
  const existing = await GeoWebAdmin_v0.deployed();
  await upgradeProxy(existing.address, GeoWebAdmin_v0, {
    deployer,
    unsafeAllowCustomTypes: true,
  });
};
