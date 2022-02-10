task("deploy:collector", "Deploy the CollectorSuperApp")
  .addParam("host", "Address of Superfluid host")
  .addParam("cfa", "Address of Superfluid ConstantFlowAgreement")
  .addParam("acceptedToken", "Address of SuperToken to accept for payment")
  .addParam("receiver", "Address of receiver")
  .setAction(async ({ host, cfa, acceptedToken, receiver }) => {
    const CollectorSuperApp = await ethers.getContractFactory(
      "CollectorSuperApp"
    );
    const collector = await CollectorSuperApp.deploy(
      host,
      cfa,
      acceptedToken,
      receiver
    );
    await collector.deployed();

    console.log("CollectorSuperApp deployed to:", collector.address);

    return collector.address;
  });
