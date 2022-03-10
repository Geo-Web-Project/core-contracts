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
import "./tasks/estimate_minting_gas";
import {
  AuctionSuperApp__factory,
  ERC721License__factory,
  GeoWebParcel__factory,
  MockClaimer__factory,
} from "./typechain-types";
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

  const [admin] = await hre.ethers.getSigners();

  // TODO: Replace claimer and reclaimer
  const mockClaimerFactory = new MockClaimer__factory(admin);
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
    claimerAddress: mockClaimer.address,
    reclaimerAddress: mockClaimer.address,
    annualFeeRate: 0.1,
    penaltyRate: 0.1,
    bidPeriodLengthInSeconds: 60 * 60 * 24 * 7, // 7 days
  });

  console.log("Contracts deployed.");

  console.log("\nSetting default configuration...");

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    licenseAddress: licenseAddress,
    parcelAddress: parcelAddress,
    superAppAddress: superAppAddress,
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
      }: {
        licenseAddress: string;
        superAppAddress: string;
        parcelAddress: string;
      },
      hre
    ) => {
      const [admin] = await hre.ethers.getSigners();

      const licenseContract = ERC721License__factory.connect(
        licenseAddress,
        admin
      );

      const parcelContract = GeoWebParcel__factory.connect(
        parcelAddress,
        admin
      );

      const superAppContract = AuctionSuperApp__factory.connect(
        superAppAddress,
        admin
      );

      // // ERC721License roles
      // const res2 = await licenseContract.grantRole(
      //   await licenseContract.MINT_ROLE(),
      //   claimerAddress ?? claimer!.address
      // );
      // await res2.wait();

      const res3 = await licenseContract.grantRole(
        await licenseContract.OPERATOR_ROLE(),
        superAppContract.address
      );
      await res3.wait();

      // // GeoWebParcel roles
      // const res6 = await parcelContract.grantRole(
      //   await parcelContract.BUILD_ROLE(),
      //   claimerAddress ?? claimer!.address
      // );
      // await res6.wait();
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
