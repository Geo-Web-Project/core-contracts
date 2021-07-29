const { ethers, upgrades } = require("hardhat");

const ADMIN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

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
