task("deploy:claimer", "Deploy the SimpleETHClaimer").setAction(async () => {
  const SimpleETHClaimer = await ethers.getContractFactory("SimpleETHClaimer");
  const claimer = await SimpleETHClaimer.deploy();
  await claimer.deployed();

  console.log("SimpleETHClaimer deployed to:", claimer.address);

  return claimer.address;
});

task("config:claimer")
  .addParam("contract", "Address of deployed SimpleETHClaimer contract")
  .addOptionalParam(
    "minClaimExpiration",
    "Minimum initial expiration for a license",
    undefined,
    types.int
  )
  .addOptionalParam("license", "Address of ERC721 License used to find owners")
  .addOptionalParam("parcel", "Address of GeoWebParcel")
  .addOptionalParam("collector", "Address of ETHExpirationCollector")
  .setAction(
    async ({ contract, minClaimExpiration, license, parcel, collector }) => {
      if (!minClaimExpiration && !license && !parcel && !collector) {
        console.log("Nothing to configure. See options");
        return;
      }

      const claimer = await ethers.getContractAt("SimpleETHClaimer", contract);

      if (minClaimExpiration) {
        const res = await claimer.setMinClaimExpiration(minClaimExpiration);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer claimer.");
      }

      if (license) {
        const res = await claimer.setLicense(license);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer license.");
      }

      if (parcel) {
        const res = await claimer.setParcel(parcel);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer parcel.");
      }

      if (collector) {
        const res = await claimer.setCollector(collector);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer collector.");
      }
    }
  );
