task("deploy:collector", "Deploy the ETHExpirationCollector").setAction(
  async () => {
    const ETHExpirationCollector = await ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy();

    console.log("ETHExpirationCollector deployed to:", collector.address);
  }
);
