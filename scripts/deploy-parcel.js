const { ethers, upgrades } = require("hardhat");

const ADMIN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  const adminContract = await ethers.getContractAt(
    "GeoWebAdminNative_v0",
    ADMIN_ADDRESS
  );

  const GeoWebCoordinate = await ethers.getContractFactory("GeoWebCoordinate");
  const geoWebCoordinate = await GeoWebCoordinate.deploy();

  console.log("GeoWebCoordinate deployed to:", geoWebCoordinate.address);

  const GeoWebCoordinatePath = await ethers.getContractFactory(
    "GeoWebCoordinatePath"
  );
  const geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();

  console.log(
    "GeoWebCoordinatePath deployed to:",
    geoWebCoordinatePath.address
  );

  const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
  const geoWebParcel = await GeoWebParcel.deploy(adminContract.address);

  console.log("GeoWebParcel deployed to:", geoWebParcel.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
