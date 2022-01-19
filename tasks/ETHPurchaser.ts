import { ethers } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:purchaser", "Deploy the ETHPurchaser").setAction(
  async (args, hre) => {
    const ETHPurchaser = await hre.ethers.getContractFactory("ETHPurchaser");
    const purchaser = await ETHPurchaser.deploy();
    await purchaser.deployed();

    console.log("ETHPurchaser deployed to:", purchaser.address);

    return purchaser.address;
  }
);

task("deploy-zksync:purchaser", "Deploy the ETHPurchaser").setAction(
  async ({ deployer }, hre) => {
    const ETHPurchaser = await deployer.loadArtifact("ETHPurchaser");
    const purchaser = await deployer.deploy(ETHPurchaser, []);

    console.log("ETHPurchaser deployed to:", purchaser.address);

    return purchaser;
  }
);

task("config:purchaser")
  .addOptionalParam("contract", "Deployed ETHPurchaser contract", undefined, types.json)
  .addOptionalParam("contractAddress", "Address of deployed ETHPurchaser contract", undefined, types.string)
  .addOptionalParam(
    "dutchAuctionLength",
    "Length of Dutch auction upon a parcel becoming invalid (seconds)",
    undefined,
    types.int
  )
  .addOptionalParam("licenseAddress", "Address of ERC721 License used to find owners")
  .addOptionalParam("accountantAddress", "Address of Accountant")
  .addOptionalParam("collectorAddress", "Address of ETHExpirationCollector")
  .setAction(
    async (
      { contract, contractAddress, dutchAuctionLength, licenseAddress, accountantAddress, collectorAddress }: { contract?: ethers.Contract, contractAddress?: string, dutchAuctionLength?: number, licenseAddress?: string, accountantAddress?: string, collectorAddress?: string },
      hre
    ) => {
      if (!dutchAuctionLength && !licenseAddress && !accountantAddress && !collectorAddress) {
        console.log("Nothing to configure. See options");
        return;
      }

      const purchaser = contractAddress ? await hre.ethers.getContractAt("ETHPurchaser", contractAddress) : contract!;

      if (dutchAuctionLength) {
        const res = await purchaser.setDutchAuctionLengthInSeconds(
          dutchAuctionLength
        );
        await res.wait();
        console.log(
          "Successfully set ETHPurchaser dutchAuctionLengthInSeconds."
        );
      }

      if (licenseAddress) {
        const res = await purchaser.setLicense(licenseAddress);
        await res.wait();
        console.log("Successfully set ETHPurchaser license.");
      }

      if (accountantAddress) {
        const res = await purchaser.setAccountant(accountantAddress);
        await res.wait();
        console.log("Successfully set ETHPurchaser accountant.");
      }

      if (collectorAddress) {
        const res = await purchaser.setCollector(collectorAddress);
        await res.wait();
        console.log("Successfully set ETHPurchaser collector.");
      }
    }
  );
