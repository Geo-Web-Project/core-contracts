import { ethers } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:collector", "Deploy the ETHExpirationCollector").setAction(
  async (args, hre) => {
    const ETHExpirationCollector = await hre.ethers.getContractFactory(
      "ETHExpirationCollector"
    );
    const collector = await ETHExpirationCollector.deploy();
    await collector.deployed();

    console.log("ETHExpirationCollector deployed to:", collector.address);

    return collector.address;
  }
);

task("deploy-zksync:collector", "Deploy the ETHExpirationCollector").setAction(
  async ({deployer}, hre) => {
    const ETHExpirationCollector = await deployer.loadArtifact("ETHExpirationCollector");
    const collector = await deployer.deploy(ETHExpirationCollector, []);

    console.log("ETHExpirationCollector deployed to:", collector.address);

    return collector;
  }
);


task("config:collector")
  .addOptionalParam("contractAddress", "Address of deployed ETHExpirationCollector contract", undefined, types.string)
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
  .addOptionalParam("licenseAddress", "Address of ERC721 License used to find owners")
  .addOptionalParam("accountantAddress", "Address of Accountant")
  .addOptionalParam("receiver", "Address of receiver of contributions")
  .setAction(
    async ({
      contractAddress,
      minContributionRate,
      minExpiration,
      maxExpiration,
      licenseAddress,
      receiver,
      accountantAddress,
    }: {
      contractAddress: string,
      minContributionRate?: string,
      minExpiration?: number,
      maxExpiration?: number,
      licenseAddress?: string,
      receiver?: string,
      accountantAddress?: string,
    }, hre) => {
      if (
        !minContributionRate &&
        !minExpiration &&
        !maxExpiration &&
        !licenseAddress &&
        !receiver &&
        !accountantAddress
      ) {
        console.log("Nothing to configure. See options");
        return;
      }

      const collector = await hre.ethers.getContractAt(
        "ETHExpirationCollector",
        contractAddress
      )

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

      if (licenseAddress) {
        const res = await collector.setLicense(licenseAddress);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector license.");
      }

      if (receiver) {
        const res = await collector.setReceiver(receiver);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector receiver.");
      }

      if (accountantAddress) {
        const res = await collector.setAccountant(accountantAddress);
        await res.wait();
        console.log("Successfully set ETHExpirationCollector accountant.");
      }
    }
  );
