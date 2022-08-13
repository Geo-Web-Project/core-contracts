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

const networks: any = {
  local: {
    gasPrice: 1000000000,
    url: `http://localhost:8545`,
  },
};

if (process.env.INFURA_KEY) {
  if (process.env.DEV_PRIVATE_KEY) {
    networks["optimism-kovan"] = {
      url: `https://kovan.optimism.io`,
      chainId: 69,
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
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  abiExporter: {
    path: "./abi",
    clear: true,
  },
  namedAccounts: {
    diamondAdmin: {
      default: 0,
    },
    user: {
      default: 1,
    },
    bidder: {
      default: 2,
    },
  },
};
