const { ethers, upgrades } = require("hardhat");

const ADMIN_ADDRESS = "0x57da7C6E90d0f4617a4498cF338130818C93400b";

async function main() {
  const adminContract = await ethers.getContractAt(
    "GeoWebAdminNative_v0",
    ADMIN_ADDRESS
  );

  const ERC721License = await ethers.getContractFactory("ERC721License");
  const instance = await upgrades.deployProxy(ERC721License, [ADMIN_ADDRESS]);
  await instance.deployed();

  await adminContract.setLicenseContract(instance.address);

  console.log("ERC721License deployed to:", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
