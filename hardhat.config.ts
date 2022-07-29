/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// require("@matterlabs/hardhat-zksync-deploy");
// require("@matterlabs/hardhat-zksync-solc");
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import { task, types } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "./tasks/GeoWebParcel";
import "./tasks/ERC721License";
import "./tasks/AuctionSuperApp";
import "./tasks/FairLaunchAuction";
import "./tasks/Reclaimer";
import "./tasks/estimate_minting_gas";
import "./tasks/claim_example";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

const networks: any = {
  local: {
    gasPrice: 1000000000,
    url: `http://localhost:8545`,
  },
};

if (process.env.INFURA_KEY) {
  networks["kovan"] = {
    url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
    chainId: 0x2a,
    gas: 4700000,
  };
  if (process.env.DEV_PRIVATE_KEY) {
    networks["rinkeby"] = {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 4,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["optimism-kovan"] = {
      url: `https://kovan.optimism.io`,
      chainId: 69,
      accounts: [process.env.DEV_PRIVATE_KEY],
    };
    networks["arbitrum-rinkeby"] = {
      url: "https://rinkeby.arbitrum.io/rpc",
      chainId: 421611,
      accounts: [process.env.DEV_PRIVATE_KEY],
      gas: 197440607,
    };
  } else {
    console.warn("Missing env.DEV_PRIVATE_KEY");
  }
} else {
  console.warn("Missing env.INFURA_KEY");
}

module.exports = {
  networks,
  zksolc: {
    version: "0.1.0",
    compilerSource: "docker",
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: "zksyncrobot/test-build",
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: process.env.ZKSYNC_NETWORK,
    ethNetwork: "rinkeby",
  },
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
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
