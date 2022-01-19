import { task } from "hardhat/config";

task("deploy:license", "Deploy the ERC721License").setAction(async (args, hre) => {
  const ERC721License = await hre.ethers.getContractFactory("ERC721License");
  const license = await ERC721License.deploy();
  await license.deployed();

  console.log("ERC721License deployed to:", license.address);

  return license.address;
});

task("deploy-zksync:license", "Deploy the ERC721License").setAction(
  async ({deployer}, hre) => {
    const ERC721License = await deployer.loadArtifact("ERC721License");
    const license = await deployer.deploy(ERC721License, []);

    console.log("ERC721License deployed to:", license.address);

    return license;
  }
);
