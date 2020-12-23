const ERC721License = artifacts.require("ERC721License");
const GeoWebAdminNative_v0 = artifacts.require("GeoWebAdminNative_v0");

module.exports = function (deployer, network, accounts) {
  return GeoWebAdminNative_v0.deployed().then(async (adminContract) => {
    let licenseContract = await deployer.deploy(
      ERC721License,
      adminContract.address
    );

    await adminContract.setLicenseContract(licenseContract.address);
  });
};
