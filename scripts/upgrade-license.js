const { ethers, upgrades } = require("hardhat");

const EXISTING_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

async function main() {
  const ERC721License = await ethers.getContractFactory("ERC721License");
  const upgraded = await upgrades.upgradeProxy(EXISTING_ADDRESS, ERC721License);
  await upgraded.deployed();
  console.log("ERC721License upgraded:", upgraded.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
