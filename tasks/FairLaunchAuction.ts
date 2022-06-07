import { ethers } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:fair-claimer", "Deploy FairLaunchClaimer").setAction(
  async (args, hre) => {
    const FairLaunchClaimer = await hre.ethers.getContractFactory(
      "FairLaunchClaimer"
    );
    const fairClaimer = await hre.upgrades.deployProxy(FairLaunchClaimer, []);
    await fairClaimer.deployed();

    console.log("FairLaunchClaimer deployed to:", fairClaimer.address);

    return fairClaimer.address;
  }
);

task("deploy-zksync:fair-claimer", "Deploy the FairLaunchClaimer").setAction(
  async ({ deployer }, hre) => {
    const FairLaunchClaimer = await deployer.loadArtifact("FairLaunchClaimer");
    const fairClaimer = await deployer.deploy(FairLaunchClaimer, []);

    console.log("FairLaunchClaimer deployed to:", fairClaimer.address);

    return fairClaimer;
  }
);

task("config:fair-claimer")
  .addOptionalParam(
    "contractAddress",
    "Address of deployed FairLaunchClaimer contract",
    undefined,
    types.string
  )
  .addOptionalParam(
    "auctionStart",
    "START time of the Dutch auction (seconds)",
    0,
    types.int
  )
  .addOptionalParam(
    "auctionEnd",
    "END time of the Dutch auction (seconds)",
    0,
    types.int
  )
  .addOptionalParam(
    "parcelAddress",
    "Address of GeoWebParcel contract",
    undefined,
    types.string
  )
  .addOptionalParam(
    "licenseAddress",
    "Address of ERC721 License used to find owners",
    undefined,
    types.string
  )
  .setAction(
    async (
      {
        contractAddress,
        auctionStart,
        auctionEnd,
        parcelAddress,
        licenseAddress,
      }: {
        contractAddress: string;
        auctionStart?: number;
        auctionEnd?: number;
        parcelAddress?: string;
        licenseAddress?: string;
      },
      hre
    ) => {
      if (!contractAddress && !licenseAddress && !parcelAddress) {
        console.log("Nothing to configure. See options");
        return;
      }

      const fairClaimer = await hre.ethers.getContractAt(
        "FairLaunchClaimer",
        contractAddress
      );

      if (auctionStart && auctionEnd) {
        // set auctionStart
        const resStart = await fairClaimer.setAuctionStart(auctionStart);
        await resStart.wait();
        console.log("Successfully set FairLaunchClaimer auctionStart.");

        // set auctionEnd
        const resEnd = await fairClaimer.setAuctionEnd(auctionEnd);
        await resEnd.wait();
        console.log("Successfully set FairLaunchClaimer auctionEnd.");
      }

      // set auction startBid
      const startBid = ethers.utils.parseEther("10");
      const resStartBid = await fairClaimer.setStartingBid(startBid);
      await resStartBid.wait();

      // set auction endBid
      const endBid = ethers.utils.parseEther("0");
      const resEndBid = await fairClaimer.setEndingBid(endBid);
      await resEndBid.wait();

      if (parcelAddress) {
        const res = await fairClaimer.setParcel(parcelAddress);
        await res.wait();
        console.log("Successfully set FairLaunchClaimer parcel.");
      }

      if (licenseAddress) {
        const res = await fairClaimer.setLicense(licenseAddress);
        await res.wait();
        console.log("Successfully set FairLaunchClaimer license.");
      }
    }
  );
