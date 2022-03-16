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
import { task, types } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "./tasks/GeoWebParcel";
import "./tasks/ERC721License";
import "./tasks/AuctionSuperApp";
import "./tasks/FairLaunchAuction";
import "./tasks/estimate_minting_gas";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");

task(
  "deploy",
  "Deploy the set of contracts with default configuration"
).setAction(async (args, hre) => {
  console.log("Deploying all contracts...");
  const parcelAddress = await hre.run("deploy:parcel");
  const licenseAddress = await hre.run("deploy:license");
  const fairClaimerAddress = await hre.run("deploy:fair-claimer");

  const [admin] = await hre.ethers.getSigners();

  // TODO: Replace reclaimer
  const mockClaimerFactory = await hre.ethers.getContractFactory("MockClaimer");
  const mockClaimer = await mockClaimerFactory.deploy();
  await mockClaimer.deployed();

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  await deployFramework(errorHandler, {
    web3: hre.web3,
    from: admin.address,
  });

  await deploySuperToken(errorHandler, [":", "ETH"], {
    web3: hre.web3,
    from: admin.address,
  });

  const sf = new SuperfluidSDK.Framework({
    web3: hre.web3,
    version: "test",
    tokens: ["ETH"],
  });
  await sf.initialize();

  // AuctionSuperApp default config
  const superAppAddress = await hre.run("deploy:super-app", {
    host: sf.host.address,
    cfa: sf.agreements.cfa.address,
    acceptedToken: sf.tokens.ETHx.address,
    beneficiary: admin.address,
    licenseAddress: licenseAddress,
    claimerAddress: fairClaimerAddress,
    reclaimerAddress: mockClaimer.address,
    annualFeeRate: 0.1,
    penaltyRate: 0.1,
    bidPeriodLengthInSeconds: 60 * 60 * 24 * 7, // 7 days
  });

  console.log("Contracts deployed.");

  console.log("\nSetting default configuration...");

  await hre.run("config:fair-claimer", {
    contractAddress: fairClaimerAddress,
    parcelAddress,
    licenseAddress,
  });

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    licenseAddress: licenseAddress,
    parcelAddress: parcelAddress,
    superAppAddress: superAppAddress,
    claimerAddress: fairClaimerAddress,
  });
  console.log("Default roles set.");
});

task("roles:set-default", "Set default roles on all deployed contracts")
  .addOptionalParam(
    "licenseAddress",
    "Address of ERC721 License used to find owners",
    undefined,
    types.string
  )
  .addOptionalParam(
    "parcelAddress",
    "Address of GeoWebParcel",
    undefined,
    types.string
  )
  .addOptionalParam(
    "claimerAddress",
    "Address of FairLaunchClaimer",
    undefined,
    types.string
  )
  .addOptionalParam(
    "superAppAddress",
    "Address of AuctionSuperApp",
    undefined,
    types.string
  )
  .setAction(
    async (
      {
        licenseAddress,
        superAppAddress,
        parcelAddress,
        claimerAddress,
      }: {
        licenseAddress: string;
        superAppAddress: string;
        parcelAddress: string;
        claimerAddress: string;
      },
      hre
    ) => {
      const licenseContract = await hre.ethers.getContractAt(
        "ERC721License",
        licenseAddress
      );

      const parcelContract = await hre.ethers.getContractAt(
        "GeoWebParcel",
        parcelAddress
      );

      const superAppContract = await hre.ethers.getContractAt(
        "AuctionSuperApp",
        superAppAddress
      );

      const claimerContract = await hre.ethers.getContractAt(
        "FairLaunchClaimer",
        claimerAddress
      );

      // ERC721License roles
      let res = await licenseContract.grantRole(
        await licenseContract.MINT_ROLE(),
        claimerContract.address
      );
      await res.wait();

      res = await licenseContract.grantRole(
        await licenseContract.OPERATOR_ROLE(),
        superAppContract.address
      );
      await res.wait();

      // GeoWebParcel roles
      res = await parcelContract.grantRole(
        await parcelContract.BUILD_ROLE(),
        claimerContract.address
      );
      await res.wait();

      // FairLaunchClaimer roles
      res = await claimerContract.grantRole(
        await claimerContract.CLAIM_ROLE(),
        superAppContract.address
      );
      await res.wait();
    }
  );

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
    version: "0.8.4",
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
};
