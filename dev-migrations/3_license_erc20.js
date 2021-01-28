const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const ERC721License = artifacts.require("ERC721License");
const GeoWebAdminERC20_v0 = artifacts.require("GeoWebAdminERC20_v0");

module.exports = function (deployer, network, accounts) {
  return GeoWebAdminERC20_v0.deployed().then(async (adminContract) => {
    let licenseContract = await deployProxy(
      ERC721License,
      [adminContract.address],
      { deployer, unsafeAllowCustomTypes: true }
    );

    await adminContract.setLicenseContract(licenseContract.address);
  });
};
