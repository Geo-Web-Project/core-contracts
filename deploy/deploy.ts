import { utils, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script`);

  const wallet = new Wallet(process.env.DEV_PRIVATE_KEY!)
  const deployer = new Deployer(hre, wallet)

  const parcel = await hre.run("deploy-zksync:parcel", {deployer: deployer});
  const accountant = await hre.run("deploy-zksync:accountant", {deployer: deployer});
  const license = await hre.run("deploy-zksync:license", {deployer: deployer});
  const purchaser = await hre.run("deploy-zksync:purchaser", {deployer: deployer});
  const collector = await hre.run("deploy-zksync:collector", {deployer: deployer});
  const claimer = await hre.run("deploy-zksync:claimer", {deployer: deployer});

  console.log("\nSetting default configuration...");

  const accounts = await hre.ethers.getSigners();

  // Accountant default config
  await hre.run("config:accountant", {
    contract: accountant,
    annualFeeRate: 0.1,
    validator: collector.address,
  });

  // ETHExpirationCollector default config
  await hre.run("config:collector", {
    contract: collector,
    minContributionRate: hre.ethers.utils
      .parseEther("0.01")
      .div(60 * 60 * 24 * 365)
      .toString(),
    minExpiration: 60 * 60 * 24 * 7, // 7 days
    maxExpiration: 60 * 60 * 24 * 730, // 730 days
    licenseAddress: license.address,
    receiver: accounts[0].address,
    accountantAddress: accountant.address,
  });

  // ETHPurchaser default config
  await hre.run("config:purchaser", {
    contract: purchaser,
    dutchAuctionLength: 60 * 60 * 24 * 7, // 7 days
    licenseAddress: license.address,
    accountantAddress: accountant.address,
    collectorAddress: collector.address,
  });

  // SimpleETHClaimer default config
  await hre.run("config:claimer", {
    contract: claimer,
    minClaimExpiration: 60 * 60 * 24 * 7, // 7 days
    licenseAddress: license.address,
    parcelAddress: parcel.address,
    collectorAddress: collector.address,
  });

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    license: license,
    parcel: parcel,
    accountant: accountant,
    purchaser: purchaser,
    collector: collector,
    claimer: claimer,
  });
  console.log("Default roles set.");
}