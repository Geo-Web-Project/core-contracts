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
import "./tasks/Reclaimer";
import "./tasks/estimate_minting_gas";
import "./tasks/claim_example";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

task(
  "deploy",
  "Deploy the set of contracts with default configuration"
).setAction(async (args, hre) => {
  console.log("Deploying all contracts...");
  const parcelAddress = await hre.run("deploy:parcel");
  const licenseAddress = await hre.run("deploy:license");
  const fairClaimerAddress = await hre.run("deploy:fair-claimer");
  const reclaimerAddress = await hre.run("deploy:reclaimer");

  const [admin] = await hre.ethers.getSigners();

  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  let sf: Framework;
  let ethx: SuperToken;
  if (hre.network.config.chainId == 31337) {
    await deployFramework(errorHandler, {
      web3: hre.web3,
      from: admin.address,
    });

    await deploySuperToken(errorHandler, [":", "ETH"], {
      web3: hre.web3,
      from: admin.address,
    });

    const jsSf = new SuperfluidSDK.Framework({
      web3: hre.web3,
      version: "test",
      tokens: ["ETH"],
    });
    await jsSf.initialize();

    sf = await Framework.create({
      networkName: "custom",
      provider: hre.web3,
      dataMode: "WEB3_ONLY",
      resolverAddress: jsSf.resolver.address,
      protocolReleaseVersion: "test",
    });

    ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);
  } else {
    sf = await Framework.create({
      networkName: hre.network.name,
      provider: hre.ethers.provider,
    });
    ethx = await sf.loadSuperToken("ETHx");
  }

  // AuctionSuperApp default config
  const superAppAddress = await hre.run("deploy:super-app", {
    host: sf.host.hostContract.address,
    acceptedToken: ethx.address,
    beneficiary: admin.address,
    licenseAddress: licenseAddress,
    claimerAddress: fairClaimerAddress,
    reclaimerAddress: reclaimerAddress,
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

  await hre.run("config:reclaimer", {
    contractAddress: reclaimerAddress,
    auctionLength: 60 * 60 * 24 * 14, // 2 weeks
    superAppAddress,
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
    reclaimerAddress: reclaimerAddress,
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
  .addOptionalParam(
    "reclaimerAddress",
    "Address of Reclaimer",
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
        reclaimerAddress,
      }: {
        licenseAddress: string;
        superAppAddress: string;
        parcelAddress: string;
        claimerAddress: string;
        reclaimerAddress: string;
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

      const fairClaimerContract = await hre.ethers.getContractAt(
        "FairLaunchClaimer",
        claimerAddress
      );

      const reclaimerContract = await hre.ethers.getContractAt(
        "Reclaimer",
        reclaimerAddress
      );

      // ERC721License roles
      let res = await licenseContract.grantRole(
        await licenseContract.MINT_ROLE(),
        fairClaimerContract.address
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
        fairClaimerContract.address
      );
      await res.wait();

      // FairLaunchClaimer roles
      res = await fairClaimerContract.grantRole(
        await fairClaimerContract.CLAIM_ROLE(),
        superAppContract.address
      );
      await res.wait();

      // Reclaimer roles
      res = await reclaimerContract.grantRole(
        await reclaimerContract.RECLAIM_ROLE(),
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
