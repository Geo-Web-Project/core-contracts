import SuperfluidSDK from "@superfluid-finance/js-sdk";
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
const hre = require("hardhat");
import { Contract } from "ethers";
import { ethers } from "hardhat";
const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

async function deploySuperfluid() {
  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  const { diamondAdmin } = await hre.getNamedAccounts();

  await deployFramework(errorHandler, {
    web3: hre.web3,
    from: diamondAdmin,
  });

  await deploySuperToken(errorHandler, [":", "ETH"], {
    web3: hre.web3,
    from: diamondAdmin,
  });

  const jsSf = new SuperfluidSDK.Framework({
    web3: hre.web3,
    version: "test",
    tokens: ["ETH"],
  });
  await jsSf.initialize();

  const sf = await Framework.create({
    chainId: hre.network.config.chainId,
    provider: hre.web3,
    resolverAddress: (jsSf.resolver as Contract).address,
    protocolReleaseVersion: "test",
  });

  const ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);

  return { sf, ethx };
}

export async function deployDiamond(
  name: string,
  { facets, from, owner }: { facets: string[]; from: string; owner: string }
) {
  // Deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded or deployed to initialize state variables
  // Read about how the diamondCut function works in the EIP2535 Diamonds standard
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.connect(
    await ethers.getSigner(from)
  ).deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // Deploy facets and set the `facetCuts` variable
  console.log("");
  console.log("Deploying facets");
  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const facetCuts = [];
  for (const FacetName of facets) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.connect(await ethers.getSigner(from)).deploy();
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  // Creating a function call
  // This call gets executed during deployment and can also be executed in upgrades
  // It is executed with delegatecall on the DiamondInit address.
  const functionCall = diamondInit.interface.encodeFunctionData("init");

  // Setting arguments that will be used in the diamond constructor
  const diamondArgs = {
    owner: owner,
    init: diamondInit.address,
    initCalldata: functionCall,
  };

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.connect(await ethers.getSigner(from)).deploy(
    facetCuts,
    diamondArgs
  );
  await diamond.deployed();
  console.log();
  console.log("Diamond deployed:", diamond.address);

  return await ethers.getContractAt(name, diamond.address);
}

async function deploy() {
  let sf: Framework;
  let ethx: SuperToken;
  if (hre.network.config.chainId == 31337) {
    const res = await deploySuperfluid();
    sf = res.sf;
    ethx = res.ethx;
  } else {
    sf = await Framework.create({
      chainId: hre.network.config.chainId!,
      provider: hre.ethers.provider,
    });
    ethx = await sf.loadSuperToken("ETHx");
  }

  // await deployDiamond();
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
