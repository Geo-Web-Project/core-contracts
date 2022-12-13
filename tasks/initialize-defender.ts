import { Contract, BigNumber } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { AdminClient } from "defender-admin-client";

const NETWORKS: Record<number, string> = {
  5: "goerli",
  10: "optimism",
};

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

export async function deploySuperfluid(hre: HardhatRuntimeEnvironment) {
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
    chainId: hre.network.config.chainId!,
    provider: hre.web3,
    resolverAddress: (jsSf.resolver as Contract).address,
    protocolReleaseVersion: "test",
  });

  const ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);

  return { sf, ethx };
}

async function deployBeneficiarySuperApp(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract
) {
  const { treasury, diamondAdmin, deployer } = await hre.getNamedAccounts();

  console.log();
  console.log("Deploying BeneficiarySuperApp");
  const factory = await hre.ethers.getContractFactory("BeneficiarySuperApp");
  const beneSuperApp = await hre.upgrades.deployProxy(
    factory.connect(await hre.ethers.getSigner(deployer)),
    [registryDiamond.address, treasury, "k1"]
  );
  await beneSuperApp.deployed();
  console.log("BeneficiarySuperApp deployed: ", beneSuperApp.address);

  // Set owner
  await beneSuperApp.transferOwnership(diamondAdmin);
  return beneSuperApp;
}

async function initializeRegistryDiamond(
  hre: HardhatRuntimeEnvironment,
  sf: Framework,
  ethx: SuperToken,
  registryDiamondAddress: string,
  beaconDiamondAddress: string
) {
  const { diamondAdmin, treasury } = await hre.getNamedAccounts();

  // Create Defender client
  const adminClient = new AdminClient({
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!,
  });

  const registryDiamond = await hre.ethers.getContractAt(
    "IRegistryDiamond",
    registryDiamondAddress
  );

  const perSecondFee = perYearToPerSecondRate(0.1);

  await adminClient.createProposal({
    contract: {
      address: registryDiamond.address,
      network: NETWORKS[hre.network.config.chainId!] as any,
    }, // Target contract
    title: "Initialize ERC721", // Title of the proposal
    description: "Initialize the parameters of ERC721", // Description of the proposal
    type: "custom", // Use 'custom' for custom admin actions
    functionInterface: {
      name: "initializeERC721",
      inputs: [
        { type: "string", name: "name" },
        { type: "string", name: "symbol" },
        { type: "string", name: "baseURI" },
      ],
    }, // Function ABI
    functionInputs: ["Geo Web Parcel License", "GEOL", ""], // Arguments to the function
    via: diamondAdmin, // Address to execute proposal
    viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
  });

  await adminClient.createProposal({
    contract: {
      address: registryDiamond.address,
      network: NETWORKS[hre.network.config.chainId!] as any,
    }, // Target contract
    title: "Initialize Claimer", // Title of the proposal
    description: "Initialize the parameters of PCOLicenseClaimerFacet", // Description of the proposal
    type: "custom", // Use 'custom' for custom admin actions
    functionInterface: {
      name: "initializeClaimer",
      inputs: [
        { type: "uint256", name: "auctionStart" },
        { type: "uint256", name: "auctionEnd" },
        { type: "uint256", name: "startingBid" },
        { type: "uint256", name: "endingBid" },
        { type: "address", name: "beacon" },
      ],
    }, // Function ABI
    functionInputs: [
      "1671123600",
      "1673715600",
      hre.ethers.utils.parseEther("100").toString(),
      hre.ethers.utils.parseEther("0.005").toString(),
      beaconDiamondAddress,
    ], // Arguments to the function
    via: diamondAdmin, // Address to execute proposal
    viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
  });

  await adminClient.createProposal({
    contract: {
      address: registryDiamond.address,
      network: NETWORKS[hre.network.config.chainId!] as any,
    }, // Target contract
    title: "Initialize Parameters", // Title of the proposal
    description: "Initialize the parameters of PCOLicenseParamsFacet", // Description of the proposal
    type: "custom", // Use 'custom' for custom admin actions
    functionInterface: {
      name: "initializeParams",
      inputs: [
        {
          name: "beneficiary",
          type: "address",
        },
        {
          name: "paymentToken",
          type: "address",
        },
        {
          name: "host",
          type: "address",
        },
        {
          name: "perSecondFeeNumerator",
          type: "uint256",
        },
        {
          name: "perSecondFeeDenominator",
          type: "uint256",
        },
        {
          name: "penaltyNumerator",
          type: "uint256",
        },
        {
          name: "penaltyDenominator",
          type: "uint256",
        },
        {
          name: "bidPeriodLengthInSeconds",
          type: "uint256",
        },
        {
          name: "reclaimAuctionLength",
          type: "uint256",
        },
        {
          name: "minForSalePrice",
          type: "uint256",
        },
      ],
    }, // Function ABI
    functionInputs: [
      treasury,
      ethx.address,
      sf.host.contract.address,
      perSecondFee.numerator.toString(),
      perSecondFee.denominator.toString(),
      "1",
      "10",
      BigNumber.from(60 * 60 * 24 * 7).toString(), // 7 days
      BigNumber.from(60 * 60 * 24 * 14).toString(), // 2 weeks,
      hre.ethers.utils.parseEther("0.005").toString(),
    ], // Arguments to the function
    via: diamondAdmin, // Address to execute proposal
    viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
  });

  console.log("Initialized RegistryDiamond.");
}

task("deploy:initialize")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addParam("pcoLicenseDiamondAddress", "PCOLicenseDiamond address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        pcoLicenseDiamondAddress,
      }: {
        registryDiamondAddress: string;
        pcoLicenseDiamondAddress: string;
      },
      hre
    ) => {
      let sf: Framework;
      let ethx: SuperToken;
      if (hre.network.config.chainId == 31337) {
        const res = await deploySuperfluid(hre);
        sf = res.sf;
        ethx = res.ethx;
      } else {
        sf = await Framework.create({
          chainId: hre.network.config.chainId!,
          provider: hre.ethers.provider,
        });
        ethx = await sf.loadSuperToken("ETHx");
      }

      await initializeRegistryDiamond(
        hre,
        sf,
        ethx,
        registryDiamondAddress,
        pcoLicenseDiamondAddress
      );
    }
  );

task("deploy:beneficiarySuperApp")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .setAction(
    async (
      {
        registryDiamondAddress,
      }: {
        registryDiamondAddress: string;
      },
      hre
    ) => {
      const { diamondAdmin } = await hre.getNamedAccounts();

      // Create Defender client
      const adminClient = new AdminClient({
        apiKey: process.env.DEFENDER_API_KEY!,
        apiSecret: process.env.DEFENDER_API_SECRET!,
      });

      const registryDiamond = await hre.ethers.getContractAt(
        "IRegistryDiamond",
        registryDiamondAddress
      );
      const beneSuperApp = await deployBeneficiarySuperApp(
        hre,
        registryDiamond
      );
      console.log("Setting beneficiary to super app...");

      await adminClient.createProposal({
        contract: {
          address: registryDiamond.address,
          network: NETWORKS[hre.network.config.chainId!] as any,
        }, // Target contract
        title: "Set Beneficiary", // Title of the proposal
        description: "Set initial beneficiary", // Description of the proposal
        type: "custom", // Use 'custom' for custom admin actions
        functionInterface: {
          name: "setBeneficiary",
          inputs: [{ type: "address", name: "beneficiary" }],
        }, // Function ABI
        functionInputs: [beneSuperApp.address], // Arguments to the function
        via: diamondAdmin, // Address to execute proposal
        viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      });
    }
  );

task("deploy:transferOwnership")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addParam("pcoLicenseDiamondAddress", "PCOLicenseDiamond address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        pcoLicenseDiamondAddress,
      }: {
        registryDiamondAddress: string;
        pcoLicenseDiamondAddress: string;
      },
      hre
    ) => {
      const { diamondAdmin, deployer } = await hre.getNamedAccounts();

      // Create Defender client
      const adminClient = new AdminClient({
        apiKey: process.env.DEFENDER_API_KEY!,
        apiSecret: process.env.DEFENDER_API_SECRET!,
      });

      const registryDiamond = await hre.ethers.getContractAt(
        "SafeOwnable",
        registryDiamondAddress,
        await hre.ethers.getSigner(deployer)
      );
      const beaconDiamond = await hre.ethers.getContractAt(
        "SafeOwnable",
        pcoLicenseDiamondAddress,
        await hre.ethers.getSigner(deployer)
      );

      await registryDiamond.transferOwnership(diamondAdmin);
      await beaconDiamond.transferOwnership(diamondAdmin);

      await adminClient.createProposal({
        contract: {
          address: registryDiamond.address,
          network: NETWORKS[hre.network.config.chainId!] as any,
        }, // Target contract
        title: "Accept Ownership of RegistryDiamond", // Title of the proposal
        description: "Accept ownership of RegistryDiamond", // Description of the proposal
        type: "custom", // Use 'custom' for custom admin actions
        functionInterface: {
          name: "acceptOwnership",
          inputs: [],
        }, // Function ABI
        functionInputs: [], // Arguments to the function
        via: diamondAdmin, // Address to execute proposal
        viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      });

      await adminClient.createProposal({
        contract: {
          address: beaconDiamond.address,
          network: NETWORKS[hre.network.config.chainId!] as any,
        }, // Target contract
        title: "Accept Ownership of PCOLicenseDiamond", // Title of the proposal
        description: "Accept ownership of PCOLicenseDiamond", // Description of the proposal
        type: "custom", // Use 'custom' for custom admin actions
        functionInterface: {
          name: "acceptOwnership",
          inputs: [],
        }, // Function ABI
        functionInputs: [], // Arguments to the function
        via: diamondAdmin, // Address to execute proposal
        viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      });
    }
  );
