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
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "./tasks/estimate_minting_gas";
import "./tasks/initialize-defender";
import "./tasks/initialize-eoa";
import "./tasks/upgrade-beneficiary";
import "./tasks/upgrades/4_1_0";
import "./tasks/upgrades/4_1_1";
import "./tasks/upgrades/4_1_5";
import "./tasks/upgrades/4_2_0";
import "./tasks/upgrades/4_3_0";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "solidity-docgen";

const networks: any = {
  local: {
    url: `http://localhost:1248`,
  },
};

if (process.env.INFURA_KEY) {
  if (process.env.DEV_PRIVATE_KEY) {
    networks["goerli"] = {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 5,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["op-goerli"] = {
      url: `https://optimism-goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 420,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["sepolia"] = {
      url: `https://endpoints.omniatech.io/v1/eth/sepolia/public`,
      chainId: 11155111,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["op-sepolia"] = {
      url: `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_TESTNET_KEY}`,
      chainId: 11155420,
      accounts: [process.env.DEV_PRIVATE_KEY],
      gasPrice: 1000000000,
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
        enabled: true,
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
    customChains: [
      {
        network: "op-sepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimism.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
      },
    ],
  },
  namedAccounts: {
    diamondAdmin: {
      default: 0,
      5: "0x9c2516a3700B2A5D3a8E72f5dBf4aFDa268D0316",
      10: "0x8FC4308da9310479dF48ef77142Eef05c363e099",
      420: "0xfF5Be16460704eFd0263dB1444Eaa216b77477c5",
      11155420: "0xfF5Be16460704eFd0263dB1444Eaa216b77477c5",
      11155111: 0,
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
      10: "0x8FC4308da9310479dF48ef77142Eef05c363e099",
      420: "0xfF5Be16460704eFd0263dB1444Eaa216b77477c5",
      11155111: 0,
      11155420: "0xfF5Be16460704eFd0263dB1444Eaa216b77477c5",
      31337: 0,
    },
    deployer: {
      default: 0,
    },
  },
};
