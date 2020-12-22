const { upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdminNative_v0 = artifacts.require("GeoWebAdminNative_v0");

module.exports = async function (deployer) {
  const existing = await GeoWebAdminNative_v0.deployed();
  await upgradeProxy(existing.address, GeoWebAdminNative_v0, {
    deployer,
    unsafeAllowCustomTypes: true,
  });
};
