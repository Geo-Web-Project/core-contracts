import { Contract, ethers } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:claimer", "Deploy the SimpleETHClaimer").setAction(async (args, hre) => {
  const SimpleETHClaimer = await hre.ethers.getContractFactory("SimpleETHClaimer");
  const claimer = await SimpleETHClaimer.deploy();
  await claimer.deployed();

  console.log("SimpleETHClaimer deployed to:", claimer.address);

  return claimer.address;
});

task("deploy-zksync:claimer", "Deploy the SimpleETHClaimer").setAction(async ({deployer}, hre) => {
  const SimpleETHClaimer = await deployer.loadArtifact("SimpleETHClaimer");
  const claimer = await deployer.deploy(SimpleETHClaimer, []);

  console.log("SimpleETHClaimer deployed to:", claimer.address);

  return claimer;
});


task("config:claimer")
  .addOptionalParam("contract", "Deployed SimpleETHClaimer contract", undefined, types.json)
  .addOptionalParam("contractAddress", "Address of deployed SimpleETHClaimer contract", undefined, types.string)
  .addOptionalParam(
    "minClaimExpiration",
    "Minimum initial expiration for a license",
    undefined,
    types.int
  )
  .addOptionalParam("licenseAddress", "Address of ERC721 License used to find owners")
  .addOptionalParam("parcelAddress", "Address of GeoWebParcel")
  .addOptionalParam("collectorAddress", "Address of ETHExpirationCollector")
  .setAction(
    async ({ contract, contractAddress, minClaimExpiration, licenseAddress, parcelAddress, collectorAddress }: { contract?: Contract, contractAddress?: string, minClaimExpiration?: number, licenseAddress?: string, parcelAddress?: string, collectorAddress?: string }, hre) => {
      if (!minClaimExpiration && !licenseAddress && !parcelAddress && !collectorAddress) {
        console.log("Nothing to configure. See options");
        return;
      }

      const claimer = contractAddress ? await hre.ethers.getContractAt("SimpleETHClaimer", contractAddress): contract!;

      if (minClaimExpiration) {
        const res = await claimer.setMinClaimExpiration(minClaimExpiration);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer claimer.");
      }

      if (licenseAddress) {
        const res = await claimer.setLicense(licenseAddress);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer license.");
      }

      if (parcelAddress) {
        const res = await claimer.setParcel(parcelAddress);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer parcel.");
      }

      if (collectorAddress) {
        const res = await claimer.setCollector(collectorAddress);
        await res.wait();
        console.log("Successfully set SimpleETHClaimer collector.");
      }
    }
  );
