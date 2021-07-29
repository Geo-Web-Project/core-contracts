const { ethers, upgrades } = require("hardhat");

const EXISTING_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  const GeoWebAdminNative_v0 = await ethers.getContractFactory(
    "GeoWebAdminNative_v0"
  );
  const upgraded = await upgrades.upgradeProxy(
    EXISTING_ADDRESS,
    GeoWebAdminNative_v0
  );
  await upgraded.deployed();
  console.log("GeoWebAdminNative_v0 upgraded:", upgraded.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
