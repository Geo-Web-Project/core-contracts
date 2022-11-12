/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-diamond-abi";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "./tasks/estimate_minting_gas";
import "./tasks/initialize";
import "./tasks/upgrades/4_1_0";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "solidity-docgen";

const networks: any = {
  local: {
    gasPrice: 1000000000,
    url: `http://localhost:8545`,
  },
};

if (process.env.INFURA_KEY) {
  if (process.env.DEV_PRIVATE_KEY) {
    networks["goerli"] = {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 5,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["optimism-goerli"] = {
      url: `https://optimism-goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 420,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
  } else {
    console.warn("Missing env.DEV_PRIVATE_KEY");
  }
} else {
  console.warn("Missing env.INFURA_KEY");
}

module.exports = {
  networks,
  solidity: {
    version: "0.8.16",
    settings: {
      optimizer: {
        enabled: false,
      },
    },
  },
  abiExporter: {
    path: "./abi",
    clear: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    outputFile: "./gas-report.out",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    diamondAdmin: {
      default: 0,
      5: "0x9c2516a3700B2A5D3a8E72f5dBf4aFDa268D0316",
    },
    user: {
      default: 1,
    },
    bidder: {
      default: 2,
    },
    other: {
      default: 3,
    },
    treasury: {
      5: "0x9c2516a3700B2A5D3a8E72f5dBf4aFDa268D0316",
      420: "0x85ACc73a9Cff049A978962f05cE0Ce6496416023",
      31337: 0,
    },
    deployer: {
      default: 0,
    },
  },
  diamondAbi: [
    {
      name: "RegistryDiamondABI",
      include: [
        "IPCOLicenseClaimerFacet",
        "IPCOLicenseClaimerFacetV2",
        "GeoWebParcelFacet",
        "GeoWebParcelFacetV2",
        "PCOLicenseParamsFacet",
        "PCOERC721Facet",
        "IDiamondWritable",
      ],
      exclude: ["Fuzzy*"],
      strict: false,
    },
    {
      name: "PCOLicenseDiamondABI",
      include: [
        "CFABasePCOFacet",
        "CFAPenaltyBidFacet",
        "CFAReclaimerFacet",
        "IDiamondWritable",
      ],
      strict: true,
    },
  ],
};
