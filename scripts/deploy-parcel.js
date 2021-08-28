const { ethers, upgrades } = require("hardhat");

const ADMIN_ADDRESS = "0xa194ff1b55f6409C0b1a03235398A3342b3374Ae";

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

  await adminContract.setParcelContract(geoWebParcel.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
