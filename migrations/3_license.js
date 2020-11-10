const ERC721License = artifacts.require("ERC721License");
const GeoWebAdmin = artifacts.require("GeoWebAdmin");

module.exports = function (deployer, network, accounts) {
  return GeoWebAdmin.deployed().then(async (adminContract) => {
    let licenseContract = await deployer.deploy(
      ERC721License,
      adminContract.address
    );

    await adminContract.setLicenseContract(licenseContract.address);
  });
};
