import SuperfluidSDK from "@superfluid-finance/js-sdk";
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
const hre = require("hardhat");
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");
import { DiamondWritable } from "../typechain-types/DiamondWritable";
import { Ownable } from "../typechain-types/Ownable";

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

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
  const DiamondInit = await ethers.getContractFactory(name);
  const diamondInit = await DiamondInit.connect(
    await ethers.getSigner(from)
  ).deploy();
  await diamondInit.deployed();
  console.log(`${name} deployed:`, diamondInit.address);

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
      target: facet.address,
      action: FacetCutAction.Add,
      selectors: getSelectors(facet),
    });
  }

  const target = ethers.constants.AddressZero;
  const data = "0x";

  // Cut diamond
  await (diamondInit as DiamondWritable)
    .connect(await ethers.getSigner(from))
    .diamondCut(facetCuts, target, data);
  console.log();
  console.log("Diamond deployed:", diamondInit.address);

  // Set owner
  if (from !== owner) {
    await (diamondInit as Ownable)
      .connect(await ethers.getSigner(from))
      .transferOwnership(owner);
  }

  return await ethers.getContractAt(`${name}ABI`, diamondInit.address);
}

async function deployBeneficiarySuperApp(registryDiamond: Contract) {
  const { treasury } = await hre.getNamedAccounts();

  console.log();
  console.log("Deploying BeneficiarySuperApp");
  const BeneficiarySuperApp = await ethers.getContractFactory(
    "BeneficiarySuperApp"
  );
  const beneSuperApp = await upgrades.deployProxy(BeneficiarySuperApp, [
    registryDiamond.address,
    treasury,
  ]);
  await beneSuperApp.deployed();
  console.log("BeneficiarySuperApp deployed: ", beneSuperApp.address);

  return beneSuperApp;
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

async function deployRegistryDiamond(sf: Framework, ethx: SuperToken) {
  const { diamondAdmin, deployer, treasury } = await hre.getNamedAccounts();

  const beaconDiamond = await deployBeaconDiamond();

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

  // Initialize
  const perSecondFee = perYearToPerSecondRate(0.1);

  await registryDiamond.initializeERC721("Geo Web Parcel License", "GEOL", "");
  await registryDiamond.initializeClaimer(0, 0, 0, 0, beaconDiamond.address);
  await registryDiamond.initializeParams(
    treasury,
    ethx.address,
    sf.host.contract.address,
    perSecondFee.numerator,
    perSecondFee.denominator,
    1,
    10,
    60 * 60 * 24 * 7, // 7 days
    60 * 60 * 24 * 14, // 2 weeks,
    ethers.utils.parseEther("0.005")
  );
  console.log("Initialized RegistryDiamond.");

  const beneSuperApp = await deployBeneficiarySuperApp(registryDiamond);
  console.log("Setting beneficiary to super app...");
  await registryDiamond.setBeneficiary(beneSuperApp.address);
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

  await deployRegistryDiamond(sf, ethx);
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
