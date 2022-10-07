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
import "hardhat-gas-reporter";
import { setupSafeDeployer } from "hardhat-safe-deployer";

const networks: any = {
  local: {
    url: `http://localhost:8545`,
  },
  hardhat: {
    deploy: ["deploy/"],
  },
};

if (process.env.SAFE_DEPLOY) {
  setupSafeDeployer(
    "0xE9976B324098dC194399f445cDbd989Bc42B4da7",
    "0x9c2516a3700B2A5D3a8E72f5dBf4aFDa268D0316",
    "https://safe-transaction.goerli.gnosis.io"
  );
}

if (process.env.INFURA_KEY) {
  if (process.env.DEV_PRIVATE_KEY) {
    networks["goerli"] = {
      url: process.env.LOCAL_RPC
        ? `http://localhost:1248`
        : `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 5,
      accounts: [process.env.DEV_PRIVATE_KEY],
      deploy: ["deploy/"],
      verify: {
        etherscan: {
          apiUrl: "https://api-goerli.etherscan.io/",
        },
      },
    };
    networks["optimism-goerli"] = {
      url: `https://optimism-goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 420,
      accounts: [process.env.DEV_PRIVATE_KEY],
      deploy: ["deploy/"],
      verify: {
        etherscan: {
          apiUrl: "https://api-goerli-optimism.etherscan.io/",
        },
      },
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
    dev: {
      5: "0x9c2516a3700B2A5D3a8E72f5dBf4aFDa268D0316",
    },
  },
  diamondAbi: [
    {
      name: "RegistryDiamond",
      include: [
        "IPCOLicenseClaimerFacet",
        "GeoWebParcelFacet",
        "PCOLicenseParamsFacet",
        "PCOERC721Facet",
      ],
      strict: false,
    },
    {
      name: "PCOLicenseDiamond",
      include: ["CFABasePCOFacet", "CFAPenaltyBidFacet", "CFAReclaimerFacet"],
      strict: true,
    },
  ],
};
