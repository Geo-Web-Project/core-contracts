import { task } from "hardhat/config";

task("deploy:parcel", "Deploy the GeoWebParcel contracts").setAction(
  async (args, hre) => {
    const GeoWebCoordinate = await hre.ethers.getContractFactory(
      "GeoWebCoordinate"
    );
    const geoWebCoordinate = await GeoWebCoordinate.deploy();
    await geoWebCoordinate.deployed();

    console.log("GeoWebCoordinate deployed to:", geoWebCoordinate.address);

    const GeoWebCoordinatePath = await hre.ethers.getContractFactory(
      "GeoWebCoordinatePath"
    );
    const geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();
    await geoWebCoordinatePath.deployed();

    console.log(
      "GeoWebCoordinatePath deployed to:",
      geoWebCoordinatePath.address
    );

    const GeoWebParcel = await hre.ethers.getContractFactory("GeoWebParcel");
    const geoWebParcel = await hre.upgrades.deployProxy(GeoWebParcel, []);
    await geoWebParcel.deployed();

    console.log("GeoWebParcel deployed to:", geoWebParcel.address);

    return geoWebParcel.address;
  }
);

task("deploy-zksync:parcel", "Deploy the GeoWebParcel contracts").setAction(
  async ({ deployer }, hre) => {
    const GeoWebCoordinate = await deployer.loadArtifact("GeoWebCoordinate");
    const geoWebCoordinate = await deployer.deploy(GeoWebCoordinate, []);

    console.log("GeoWebCoordinate deployed to:", geoWebCoordinate.address);

    const GeoWebCoordinatePath = await deployer.loadArtifact(
      "GeoWebCoordinatePath"
    );
    const geoWebCoordinatePath = await deployer.deploy(
      GeoWebCoordinatePath,
      []
    );

    console.log(
      "GeoWebCoordinatePath deployed to:",
      geoWebCoordinatePath.address
    );

    const GeoWebParcel = await deployer.loadArtifact("GeoWebParcel");
    const geoWebParcel = await deployer.deploy(GeoWebParcel, []);

    console.log("GeoWebParcel deployed to:", geoWebParcel.address);

    return geoWebParcel;
  }
);
