const hre = require("hardhat");
import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { DiamondWritable } from "../typechain-types/DiamondWritable";
import { Ownable } from "../typechain-types/Ownable";
const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

export async function deployDiamond(
  name: string,
  {
    facets,
    from,
    owner,
  }: { facets: string[]; from: string | Signer; owner: string }
) {
  from = typeof from === "string" ? await ethers.getSigner(from) : from;

  const DiamondInit = await ethers.getContractFactory(name);
  const diamondInit = await DiamondInit.connect(from).deploy();
  await diamondInit.deployed();
  console.log(`${name} deployed:`, diamondInit.address);

  // Deploy facets and set the `facetCuts` variable
  console.log("");
  console.log("Deploying facets");
  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const facetCuts = [];
  for (const FacetName of facets) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.connect(from).deploy();
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);
    facetCuts.push({
      target: facet.address,
      action: FacetCutAction.Add,
      selectors: getSelectors(facet),
    });
  }

  const target = ethers.constants.AddressZero;
  const data = "0x";

  // Cut diamond
  await (diamondInit as DiamondWritable)
    .connect(from)
    .diamondCut(facetCuts, target, data);
  console.log();
  console.log("Diamond deployed:", diamondInit.address);

  // Set owner
  if ((await from.getAddress()) !== owner) {
    await (diamondInit as Ownable).connect(from).transferOwnership(owner);
  }

  return await ethers.getContractAt(`I${name}`, diamondInit.address);
}

async function deployBeaconDiamond() {
  const { diamondAdmin, deployer } = await hre.getNamedAccounts();

  console.log();
  console.log("Deploying PCOLicenseDiamond");
  const beaconDiamond = await deployDiamond("PCOLicenseDiamond", {
    facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet", "CFAReclaimerFacet"],
    owner: diamondAdmin,
    from: deployer,
  });

  console.log("PCOLicenseDiamond deployed: ", beaconDiamond.address);
  return beaconDiamond;
}

async function deployRegistryDiamond() {
  const { diamondAdmin, deployer } = await hre.getNamedAccounts();

  await deployBeaconDiamond();

  console.log();
  console.log("Deploying RegistryDiamond");
  const registryDiamond = await deployDiamond("RegistryDiamond", {
    facets: [
      "PCOLicenseClaimerFacet",
      "GeoWebParcelFacet",
      "PCOLicenseParamsFacet",
      "PCOERC721Facet",
    ],
    owner: diamondAdmin,
    from: deployer,
  });
  console.log("RegistryDiamond deployed: ", registryDiamond.address);
}

async function deploy() {
  await deployRegistryDiamond();
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
