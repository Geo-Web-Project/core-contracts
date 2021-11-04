task("deploy:purchaser", "Deploy the ETHPurchaser").setAction(async () => {
  const ETHPurchaser = await ethers.getContractFactory("ETHPurchaser");
  const purchaser = await ETHPurchaser.deploy();
  await purchaser.deployed();

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
        const res = await purchaser.setDutchAuctionLengthInSeconds(
          dutchAuctionLength
        );
        await res.wait();
        console.log(
          "Successfully set ETHPurchaser dutchAuctionLengthInSeconds."
        );
      }

      if (license) {
        const res = await purchaser.setLicense(license);
        await res.wait();
        console.log("Successfully set ETHPurchaser license.");
      }

      if (accountant) {
        const res = await purchaser.setAccountant(accountant);
        await res.wait();
        console.log("Successfully set ETHPurchaser accountant.");
      }

      if (collector) {
        const res = await purchaser.setCollector(collector);
        await res.wait();
        console.log("Successfully set ETHPurchaser collector.");
      }
    }
  );
