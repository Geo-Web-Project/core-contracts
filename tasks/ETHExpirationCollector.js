task("deploy:collector", "Deploy the ETHExpirationCollector").setAction(
  async () => {
    const ETHExpirationCollector = await ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy();

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
        await collector.setMinContributionRate(minContributionRate);
        console.log(
          "Successfully set ETHExpirationCollector minContributionRate."
        );
      }

      if (minExpiration) {
        await collector.setMinExpiration(minExpiration);
        console.log("Successfully set ETHExpirationCollector minExpiration.");
      }

      if (maxExpiration) {
        await collector.setMaxExpiration(maxExpiration);
        console.log("Successfully set ETHExpirationCollector maxExpiration.");
      }

      if (license) {
        await collector.setLicense(license);
        console.log("Successfully set ETHExpirationCollector license.");
      }

      if (receiver) {
        await collector.setReceiver(receiver);
        console.log("Successfully set ETHExpirationCollector receiver.");
      }

      if (accountant) {
        await collector.setAccountant(accountant);
        console.log("Successfully set ETHExpirationCollector accountant.");
      }
    }
  );
