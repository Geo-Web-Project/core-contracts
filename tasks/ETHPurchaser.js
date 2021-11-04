task("deploy:purchaser", "Deploy the ETHPurchaser").setAction(async () => {
  const ETHPurchaser = await ethers.getContractFactory("ETHPurchaser");
  const purchaser = await ETHPurchaser.deploy();

  console.log("ETHPurchaser deployed to:", purchaser.address);

  return purchaser.address;
});

task("config:purchaser")
  .addParam("contract", "Address of deployed ETHPurchaser contract")
  .addOptionalParam(
    "dutchAuctionLength",
    "Length of Dutch auction upon a parcel becoming invalid (seconds)",
    undefined,
    types.int
  )
  .addOptionalParam("license", "Address of ERC721 License used to find owners")
  .addOptionalParam("accountant", "Address of Accountant")
  .addOptionalParam("collector", "Address of ETHExpirationCollector")
  .setAction(
    async ({
      contract,
      dutchAuctionLength,
      license,
      accountant,
      collector,
    }) => {
      if (!dutchAuctionLength && !license && !accountant && !collector) {
        console.log("Nothing to configure. See options");
        return;
      }

      const purchaser = await ethers.getContractAt("ETHPurchaser", contract);

      if (dutchAuctionLength) {
        await purchaser.setDutchAuctionLengthInSeconds(dutchAuctionLength);
        console.log(
          "Successfully set ETHPurchaser dutchAuctionLengthInSeconds."
        );
      }

      if (license) {
        await purchaser.setLicense(license);
        console.log("Successfully set ETHPurchaser license.");
      }

      if (accountant) {
        await purchaser.setAccountant(accountant);
        console.log("Successfully set ETHPurchaser accountant.");
      }

      if (collector) {
        await purchaser.setCollector(collector);
        console.log("Successfully set ETHPurchaser collector.");
      }
    }
  );
