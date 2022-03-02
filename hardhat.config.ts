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
import "@eth-optimism/hardhat-ovm";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "./tasks/GeoWebParcel";
import "./tasks/ERC721License";
import "./tasks/estimate_minting_gas";

task(
  "deploy",
  "Deploy the set of contracts with default configuration"
).setAction(async (args, hre) => {
  console.log("Deploying all contracts...");
  const parcelAddress = await hre.run("deploy:parcel");
  const licenseAddress = await hre.run("deploy:license");

  const accounts = await hre.ethers.getSigners();

  // CollectorSuperApp default config
  const collectorAddress = await hre.run("deploy:collector", {
    host: "0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6",
    cfa: "0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A",
    acceptedToken: "0xa623b2DD931C5162b7a0B25852f4024Db48bb1A0",
    receiver: accounts[0].address,
  });

  console.log("Contracts deployed.");

  console.log("\nSetting default configuration...");

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    licenseAddress: licenseAddress,
    parcelAddress: parcelAddress,
    collectorAddress: collectorAddress,
  });
  console.log("Default roles set.");
});

task("deploy:contracts-only", "Deploy the set of bare contracts").setAction(
  async (args, hre) => {
    await hre.run("deploy:parcel");
    await hre.run("deploy:license");
    await hre.run("deploy:collector");
  }
);

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
  .setAction(
    async (
      {
        licenseAddress,
        collectorAddress,
        parcelAddress,
      }: {
        licenseAddress: string;
        collectorAddress: string;
        parcelAddress: string;
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

      // // ERC721License roles
      // const res2 = await licenseContract.grantRole(
      //   await licenseContract.MINT_ROLE(),
      //   claimerAddress ?? claimer!.address
      // );
      // await res2.wait();

      // const res3 = await licenseContract.grantRole(
      //   await licenseContract.OPERATOR_ROLE(),
      //   purchaserAddress ?? purchaser!.address
      // );
      // await res3.wait();

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
  sokul: {
    url: "https://sokol.poa.network",
    chainId: 77,
    gasPrice: 1000000000,
  },
  xdai: {
    url: "https://xdai.poanetwork.dev",
    network_id: 100,
    gasPrice: 1000000000,
  },
  arbitrumRinkeby: {
    url: "https://rinkeby.arbitrum.io/rpc",
    chainId: 421611,
    gasPrice: 0,
  },
  optimisticKovan: {
    url: "https://kovan.optimism.io",
    gasPrice: 15000000,
    ovm: true, // This sets the network as using the ovm and ensure contract will be compiled against that.
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
  ovm: {
    solcVersion: "0.6.12",
  },
  abiExporter: {
    path: "./abi",
    clear: true,
  },
};
