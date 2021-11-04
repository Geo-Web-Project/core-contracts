task("deploy:parcel", "Deploy the GeoWebParcel contracts").setAction(
  async () => {
    const GeoWebCoordinate = await ethers.getContractFactory(
      "GeoWebCoordinate"
    );
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
    const geoWebParcel = await GeoWebParcel.deploy();

    console.log("GeoWebParcel deployed to:", geoWebParcel.address);
  }
);
