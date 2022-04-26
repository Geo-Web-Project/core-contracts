import { task, types } from 'hardhat/config';

task("deploy:reclaimer", "Deploy Reclaimer").setAction(
  async (args, hre) => {
    const Reclaimer = await hre.ethers.getContractFactory("Reclaimer");
    const reclaimer = await Reclaimer.deploy();
    await reclaimer.deployed();

    console.log("Reclaimer deployed to:", reclaimer.address);

    return reclaimer.address;
  }
);

task("deploy-zksync:reclaimer", "Deploy the Reclaimer").setAction(
  async ({ deployer }, hre) => {
    const Reclaimer = await deployer.loadArtifact("Reclaimer");
    const reclaimer = await deployer.deploy(Reclaimer, []);

    console.log("Reclaimer deployed to:", reclaimer.address);

    return reclaimer;
  }
);

task("config:reclaimer")
  .addOptionalParam("contractAddress", "Address of deployed Reclaimer contract", undefined, types.string)
  .addOptionalParam("auctionLength", "Length of the Reclaimer Dutch auction (seconds)", undefined, types.int)
  .addOptionalParam("superAppAddress", "Address of Auction Super App contract", undefined, types.string)
  .addOptionalParam("licenseAddress", "Address of ERC721 License used to find owners", undefined, types.string)
  .setAction(
    async (
      { contractAddress, auctionLength, superAppAddress, licenseAddress }: { contractAddress: string, auctionLength?: number, superAppAddress?: string, licenseAddress?: string },
      hre
    ) => {
      if (
        !contractAddress &&
        !auctionLength &&
        !licenseAddress &&
        !superAppAddress
      ) {
        console.log("Nothing to configure. See options");
        return;
      }

      const reclaimer = await hre.ethers.getContractAt("Reclaimer", contractAddress);

      if (auctionLength) {
        // set auctionLength
        const resStart = await reclaimer.setAuctionLength(auctionLength);
        await resStart.wait();
        console.log("Successfully set Reclaimer auctionLength.");
      }

      if (superAppAddress) {
        const res = await reclaimer.setSuperApp(superAppAddress);
        await res.wait();
        console.log("Successfully set Reclaimer parcel.");
      }

      if (licenseAddress) {
        const res = await reclaimer.setLicense(licenseAddress);
        await res.wait();
        console.log("Successfully set Reclaimer license.");
      }
    }
  );
