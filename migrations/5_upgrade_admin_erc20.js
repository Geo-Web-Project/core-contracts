const { upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdminERC20_v0 = artifacts.require("GeoWebAdminERC20_v0");

module.exports = async function (deployer) {
  const existing = await GeoWebAdminERC20_v0.deployed();
  await upgradeProxy(existing.address, GeoWebAdminERC20_v0, {
    deployer,
    unsafeAllowCustomTypes: true,
  });
};
