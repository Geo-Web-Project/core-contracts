import { task } from "hardhat/config";
import { ERC721License__factory } from "../typechain-types";

task("deploy:license", "Deploy the ERC721License").setAction(
  async (args, hre) => {
    const [admin] = await hre.ethers.getSigners();

    const factory = new ERC721License__factory(admin);
    const license = await factory.deploy();
    await license.deployed();

    console.log("ERC721License deployed to:", license.address);

    return license.address;
  }
);

task("deploy-zksync:license", "Deploy the ERC721License").setAction(
  async ({ deployer }, hre) => {
    const ERC721License = await deployer.loadArtifact("ERC721License");
    const license = await deployer.deploy(ERC721License, []);

    console.log("ERC721License deployed to:", license.address);

    return license;
  }
);
