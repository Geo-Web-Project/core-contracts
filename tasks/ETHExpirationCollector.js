task("deploy:collector", "Deploy the ETHExpirationCollector").setAction(
  async () => {
    const ETHExpirationCollector = await ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy();
    await collector.deployed();

    console.log("ETHExpirationCollector deployed to:", collector.address);

    return collector.address;
  }
);

task("config:collector")
  .addParam("contract", "Address of deployed ETHExpirationCollector contract")
  .addOptionalParam(
    "minContributionRate",
    "Minimum contribution rate for a license"
  )
  .addOptionalParam(
    "minExpiration",
    "Minimum expiration for a license",
    undefined,
    types.int
  )
  .addOptionalParam(
    "maxExpiration",
    "Maximum expiration for a license",
    undefined,
    types.int
  )
  .addOptionalParam("license", "Address of ERC721 License used to find owners")
  .addOptionalParam("accountant", "Address of Accountant")
  .addOptionalParam("receiver", "Address of receiver of contributions")
  .setAction(
    async ({
      contract,
      minContributionRate,
      minExpiration,
      maxExpiration,
      license,
      receiver,
      accountant,
    }) => {
      if (
        !minContributionRate &&
        !minExpiration &&
        !maxExpiration &&
        !license &&
        !receiver &&
        !accountant
      ) {
        console.log("Nothing to configure. See options");
        return;
      }

      const collector = await ethers.getContractAt(
        "ETHExpirationCollector",
        contract
      );

      if (minContributionRate) {
        const res = await collector.setMinContributionRate(minContributionRate);
        await res.wait();
        console.log(
          "Successfully set ETHExpirationCollector minContributionRate."
        );
      }

      if (minExpiration) {
        const res = await collector.setMinExpiration(minExpiration);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector minExpiration.");
      }

      if (maxExpiration) {
        const res = await collector.setMaxExpiration(maxExpiration);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector maxExpiration.");
      }

      if (license) {
        const res = await collector.setLicense(license);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector license.");
      }

      if (receiver) {
        const res = await collector.setReceiver(receiver);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector receiver.");
      }

      if (accountant) {
        const res = await collector.setAccountant(accountant);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector accountant.");
      }
    }
  );
