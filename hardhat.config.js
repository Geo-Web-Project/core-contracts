/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-waffle");
require("@eth-optimism/hardhat-ovm");
require("solidity-coverage");
require("./tasks/Accountant");
require("./tasks/GeoWebParcel");
require("./tasks/ERC721License");
require("./tasks/ETHExpirationCollector");
require("./tasks/ETHPurchaser");
require("./tasks/SimpleETHClaimer");

task(
  "deploy",
  "Deploy the set of contracts with default configuration"
).setAction(async () => {
  console.log("Deploying all contracts...");
  const parcel = await hre.run("deploy:parcel");
  const accountant = await hre.run("deploy:accountant");
  const license = await hre.run("deploy:license");
  const purchaser = await hre.run("deploy:purchaser");
  const collector = await hre.run("deploy:collector");
  const claimer = await hre.run("deploy:claimer");
  console.log("Contracts deployed.");

  console.log("\nSetting default configuration...");

  const accounts = await ethers.getSigners();

  // Accountant default config
  await hre.run("config:accountant", {
    contract: accountant,
    annualFeeRate: 0.1,
    validator: collector,
  });

  // ETHExpirationCollector default config
  await hre.run("config:collector", {
    contract: collector,
    minContributionRate: ethers.utils.parseEther("0.01").toString(),
    minExpiration: 60 * 60 * 24 * 7, // 7 days
    maxExpiration: 60 * 60 * 24 * 730, // 730 days
    license: license,
    receiver: accounts[0].address,
    accountant: accountant,
  });

  // ETHPurchaser default config
  await hre.run("config:purchaser", {
    contract: purchaser,
    dutchAuctionLength: 60 * 60 * 24 * 7, // 7 days
    license: license,
    accountant: accountant,
    collector: collector,
  });

  // SimpleETHClaimer default config
  await hre.run("config:claimer", {
    contract: claimer,
    minClaimExpiration: 60 * 60 * 24 * 7, // 7 days
    license: license,
    parcel: parcel,
    collector: collector,
  });

  console.log("Default configuration set.");

  console.log("\nSetting roles...");
  // Set roles
  await hre.run("roles:set-default", {
    license: license,
    parcel: parcel,
    accountant: accountant,
    purchaser: purchaser,
    collector: collector,
    claimer: claimer,
  });
  console.log("Default roles set.");
});

task("deploy:contracts-only", "Deploy the set of bare contracts").setAction(
  async () => {
    await hre.run("deploy:parcel");
    await hre.run("deploy:accountant");
    await hre.run("deploy:license");
    await hre.run("deploy:purchaser");
    await hre.run("deploy:collector");
    await hre.run("deploy:claimer");
  }
);

task("roles:set-default", "Set default roles on all deployed contracts")
  .addParam("license", "Address of ERC721 License used to find owners")
  .addParam("accountant", "Address of Accountant")
  .addParam("collector", "Address of ETHExpirationCollector")
  .addParam("parcel", "Address of GeoWebParcel")
  .addParam("purchaser", "Address of ETHPurchaser")
  .addParam("claimer", "Address of SimpleETHClaimer")
  .setAction(
    async ({ license, accountant, collector, parcel, purchaser, claimer }) => {
      const licenseContract = await ethers.getContractAt(
        "ERC721License",
        license
      );
      const collectorContract = await ethers.getContractAt(
        "ETHExpirationCollector",
        collector
      );
      const parcelContract = await ethers.getContractAt("GeoWebParcel", parcel);

      await hre.run("roles:accountant", {
        accountant: accountant,
        collector: collector,
      });

      // ERC721License roles
      const res2 = await licenseContract.grantRole(
        await licenseContract.MINT_ROLE(),
        claimer
      );
      await res2.wait();

      const res3 = await licenseContract.grantRole(
        await licenseContract.OPERATOR_ROLE(),
        purchaser
      );
      await res3.wait();

      // ETHExpirationCollector roles
      const res4 = await collectorContract.grantRole(
        await collectorContract.MODIFY_CONTRIBUTION_ROLE(),
        claimer
      );
      await res4.wait();

      const res5 = await collectorContract.grantRole(
        await collectorContract.MODIFY_CONTRIBUTION_ROLE(),
        purchaser
      );
      await res5.wait();

      // GeoWebParcel roles
      const res6 = await parcelContract.grantRole(
        await parcelContract.BUILD_ROLE(),
        claimer
      );
      await res6.wait();
    }
  );

module.exports = {
  networks: {
    hardhat: {
      gasPrice: 0,
    },
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
