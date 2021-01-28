const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const ERC721License = artifacts.require("ERC721License");
const GeoWebAdminNative_v0 = artifacts.require("GeoWebAdminNative_v0");

module.exports = function (deployer, network, accounts) {
  return GeoWebAdminNative_v0.deployed().then(async (adminContract) => {
    let licenseContract = await deployProxy(
      ERC721License,
      [adminContract.address],
      { deployer, unsafeAllowCustomTypes: true }
    );

    await adminContract.setLicenseContract(licenseContract.address);
  });
};
