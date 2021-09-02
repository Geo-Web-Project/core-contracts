const { ethers, upgrades } = require("hardhat");

const ADMIN_ADDRESS = "0x2140ccF4d5d887Aa63e3fc84DDf8930deD3a6E8C";

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
