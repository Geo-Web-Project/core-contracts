const ERC721License = artifacts.require("ERC721License");
const GeoWebAdmin_v0 = artifacts.require("GeoWebAdmin_v0");

module.exports = function (deployer, network, accounts) {
  return GeoWebAdmin_v0.deployed().then(async (adminContract) => {
    let licenseContract = await deployer.deploy(
      ERC721License,
      adminContract.address
    );

    await adminContract.setLicenseContract(licenseContract.address);
  });
};
