/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// require("@matterlabs/hardhat-zksync-deploy");
// require("@matterlabs/hardhat-zksync-solc");
require('@typechain/hardhat');
require('@nomiclabs/hardhat-ethers');
import "@nomiclabs/hardhat-waffle";
import { task, types } from "hardhat/config";
import { ethers } from "ethers";
require("@openzeppelin/hardhat-upgrades");
require("@eth-optimism/hardhat-ovm");
require("solidity-coverage");
require("./tasks/Accountant");
require("./tasks/GeoWebParcel");
require("./tasks/ERC721License");
require("./tasks/ETHExpirationCollector");
require("./tasks/ETHPurchaser");
require("./tasks/SimpleETHClaimer");
require("./tasks/estimate_minting_gas");

task(
  "deploy",
  "Deploy the set of contracts with default configuration"
).setAction(async (args, hre) => {
  console.log("Deploying all contracts...");
  const parcelAddress = await hre.run("deploy:parcel");
  const accountantAddress = await hre.run("deploy:accountant");
  const licenseAddress = await hre.run("deploy:license");
  const purchaserAddress = await hre.run("deploy:purchaser");
  const collectorAddress = await hre.run("deploy:collector");
  const claimerAddress = await hre.run("deploy:claimer");
  console.log("Contracts deployed.");

  console.log("\nSetting default configuration...");

  const accounts = await hre.ethers.getSigners();

  // Accountant default config
  await hre.run("config:accountant", {
    contractAddress: accountantAddress,
    annualFeeRate: 0.1,
    validator: collectorAddress,
  });

  // ETHExpirationCollector default config
  await hre.run("config:collector", {
    licenseAddress,
    accountantAddress,
    contractAddress: collectorAddress,
    minContributionRate: hre.ethers.utils
      .parseEther("0.01")
      .div(60 * 60 * 24 * 365)
      .toString(),
    minExpiration: 60 * 60 * 24 * 7, // 7 days
    maxExpiration: 60 * 60 * 24 * 730, // 730 days
    receiver: accounts[0].address,
  });

  // ETHPurchaser default config
  await hre.run("config:purchaser", {
    licenseAddress,
    accountantAddress,
    collectorAddress,
    contractAddress: purchaserAddress,
    dutchAuctionLength: 60 * 60 * 24 * 7, // 7 days
  });

  // SimpleETHClaimer default config
  await hre.run("config:claimer", {
    contractAddress: claimerAddress,
    licenseAddress,
    parcelAddress,
    collectorAddress,
    minClaimExpiration: 60 * 60 * 24 * 7, // 7 days
  });

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    licenseAddress,
    accountantAddress,
    collectorAddress,
    parcelAddress,
    purchaserAddress,
    claimerAddress,
  });
  console.log("Default roles set.");
});

task("deploy:contracts-only", "Deploy the set of bare contracts").setAction(
  async (args, hre) => {
    await hre.run("deploy:parcel");
    await hre.run("deploy:accountant");
    await hre.run("deploy:license");
    await hre.run("deploy:purchaser");
    await hre.run("deploy:collector");
    await hre.run("deploy:claimer");
  }
);

task("roles:set-default", "Set default roles on all deployed contracts")
  .addOptionalParam("licenseAddress", "Address of ERC721 License used to find owners", undefined, types.string)
  .addOptionalParam("accountantAddress", "Address of Accountant", undefined, types.string)
  .addOptionalParam("collectorAddress", "Address of ETHExpirationCollector", undefined, types.string)
  .addOptionalParam("parcelAddress", "Address of GeoWebParcel", undefined, types.string)
  .addOptionalParam("purchaserAddress", "Address of ETHPurchaser", undefined, types.string)
  .addOptionalParam("claimerAddress", "Address of SimpleETHClaimer", undefined, types.string)
  .setAction(
    async ({ licenseAddress, accountantAddress, collectorAddress, parcelAddress, purchaserAddress, claimerAddress }: { licenseAddress: string, accountantAddress: string, collectorAddress: string, parcelAddress: string, purchaserAddress: string, claimerAddress: string }, hre) => {
      const licenseContract = await hre.ethers.getContractAt(
        "ERC721License",
        licenseAddress
      );
      const collectorContract = await hre.ethers.getContractAt(
        "ETHExpirationCollector",
        collectorAddress
      );

      const parcelContract = await hre.ethers.getContractAt("GeoWebParcel", parcelAddress);

      await hre.run("roles:accountant", {
        accountantAddress,
        collectorAddress,
      });

      // ERC721License roles
      const res2 = await licenseContract.grantRole(
        await licenseContract.MINT_ROLE(),
        claimerAddress
      );
      await res2.wait();

      const res3 = await licenseContract.grantRole(
        await licenseContract.OPERATOR_ROLE(),
        purchaserAddress
      );
      await res3.wait();

      // ETHExpirationCollector roles
      const res4 = await collectorContract.grantRole(
        await collectorContract.MODIFY_CONTRIBUTION_ROLE(),
        claimerAddress
      );
      await res4.wait();

      const res5 = await collectorContract.grantRole(
        await collectorContract.MODIFY_CONTRIBUTION_ROLE(),
        purchaserAddress
      );
      await res5.wait();

      // GeoWebParcel roles
      const res6 = await parcelContract.grantRole(
        await parcelContract.BUILD_ROLE(),
        claimerAddress
      );
      await res6.wait();
    }
  );

module.exports = {
  networks: {
    local: {
      gasPrice: 1000000000,
      url: `http://localhost:8545`,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 0x2a,
      gas: 4700000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 4,
      accounts: [process.env.DEV_PRIVATE_KEY],
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
  },
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
    },
  },
  ovm: {
    solcVersion: "0.6.12",
  },
};
