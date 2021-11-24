task("deploy:parcel", "Deploy the GeoWebParcel contracts").setAction(
  async () => {
    const GeoWebCoordinate = await ethers.getContractFactory(
      "GeoWebCoordinate"
    );
    const geoWebCoordinate = await GeoWebCoordinate.deploy();
    await geoWebCoordinate.deployed();

    console.log("GeoWebCoordinate deployed to:", geoWebCoordinate.address);

    const GeoWebCoordinatePath = await ethers.getContractFactory(
      "GeoWebCoordinatePath"
    );
    const geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();
    await geoWebCoordinatePath.deployed();

    console.log(
      "GeoWebCoordinatePath deployed to:",
      geoWebCoordinatePath.address
    );

    const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
    const geoWebParcel = await GeoWebParcel.deploy();
    await geoWebParcel.deployed();

    console.log("GeoWebParcel deployed to:", geoWebParcel.address);

    return geoWebParcel.address;
  }
);