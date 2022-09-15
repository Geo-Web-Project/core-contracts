import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { ethers } from "hardhat";

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const { diamondAdmin, treasury } = await getNamedAccounts();

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  let sf: Framework;
  let ethx: SuperToken;
  if (hre.network.config.chainId == 31337) {
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

    sf = await Framework.create({
      chainId: hre.network.config.chainId,
      provider: hre.web3,
      resolverAddress: jsSf.resolver.address,
      protocolReleaseVersion: "test",
    });

    ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);
  } else {
    sf = await Framework.create({
      chainId: hre.network.config.chainId!,
      provider: hre.ethers.provider,
    });
    ethx = await sf.loadSuperToken("ETHx");
  }

  const { diamond } = deployments;

  // Deploy registry diamond
  await diamond.deploy("RegistryDiamond", {
    from: diamondAdmin,
    owner: diamondAdmin,
    facets: [
      "PCOLicenseClaimerFacet",
      "GeoWebParcelFacet",
      "PCOLicenseParamsFacet",
      "ERC721Facet",
    ],
    log: true,
  });

  const registryDiamond = await ethers.getContract(
    "RegistryDiamond",
    diamondAdmin
  );

  // Deploy PCOLicense beacon
  await diamond.deploy("PCOLicenseBeacon", {
    from: diamondAdmin,
    owner: diamondAdmin,
    facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
    log: true,
  });

  const beacon = await ethers.getContract("PCOLicenseBeacon", diamondAdmin);

  // Initialize
  const perSecondFee = perYearToPerSecondRate(0.1);
  const penalty = perYearToPerSecondRate(0.1);

  await registryDiamond.initializeClaimer(0, 0, 0, 0, beacon.address);
  await registryDiamond.initializeParams(
    treasury,
    ethx.address,
    sf.host.contract.address,
    perSecondFee.numerator,
    perSecondFee.denominator,
    penalty.numerator,
    penalty.denominator,
    60 * 60 * 24 * 7, // 7 days
    60 * 60 * 24 * 14 // 2 weeks
  );
};
export default func;
func.tags = ["Main"];
