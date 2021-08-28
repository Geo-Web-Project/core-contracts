/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-waffle");
require("@eth-optimism/hardhat-ovm");

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

task("deploy", "Deploy the set of contracts").setAction(async () => {
  let rate = perYearToPerSecondRate(0.1);
  let minInitialValue = ethers.utils.parseEther("0.1");
  let minClaimExpiration = 60 * 60 * 24 * 365; // 365 days
  let minExpiration = 60 * 60 * 24; // 1 day
  let maxExpiration = 60 * 60 * 24 * 730; // 730 days
  let ductionAuctionLength = 60 * 60 * 24 * 7; // 7 days

  const GeoWebAdminNative_v0 = await ethers.getContractFactory(
    "GeoWebAdminNative_v0"
  );
  const adminContract = await upgrades.deployProxy(GeoWebAdminNative_v0, [
    minInitialValue,
    minClaimExpiration,
    minExpiration,
    maxExpiration,
    rate.numerator,
    rate.denominator,
    ductionAuctionLength,
  ]);
  await adminContract.deployed();

  console.log("GeoWebAdminNative_v0 deployed to:", adminContract.address);

  const ERC721License = await ethers.getContractFactory("ERC721License");
  const licenseContract = await upgrades.deployProxy(ERC721License, [
    adminContract.address,
  ]);
  await licenseContract.deployed();

  await adminContract.setLicenseContract(licenseContract.address);

  console.log("ERC721License deployed to:", licenseContract.address);

  const GeoWebCoordinate = await ethers.getContractFactory("GeoWebCoordinate");
  const geoWebCoordinate = await GeoWebCoordinate.deploy();

  console.log("GeoWebCoordinate deployed to:", geoWebCoordinate.address);

  const GeoWebCoordinatePath = await ethers.getContractFactory(
    "GeoWebCoordinatePath"
  );
  const geoWebCoordinatePath = await GeoWebCoordinatePath.deploy();

  console.log(
    "GeoWebCoordinatePath deployed to:",
    geoWebCoordinatePath.address
  );

  const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
  const geoWebParcel = await GeoWebParcel.deploy(adminContract.address);

  console.log("GeoWebParcel deployed to:", geoWebParcel.address);
});

module.exports = {
  networks: {
    hardhat: {
      gasPrice: 1000000000,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEV_PRIVATE_KEY],
      chainId: 0x2a,
      gas: 4700000,
    },
    sokul: {
      url: "https://sokol.poa.network",
      accounts: [process.env.DEV_PRIVATE_KEY],
      chainId: 77,
      gasPrice: 1000000000,
    },
    xdai: {
      url: "https://xdai.poanetwork.dev",
      accounts: [process.env.DEV_PRIVATE_KEY],
      network_id: 100,
      gasPrice: 1000000000,
    },
    arbitrumRinkeby: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: [process.env.DEV_PRIVATE_KEY],
      gasPrice: 0,
    },
    optimisticKovan: {
      url: "https://kovan.optimism.io",
      accounts: [process.env.DEV_PRIVATE_KEY],
      gasPrice: 15000000,
      ovm: true, // This sets the network as using the ovm and ensure contract will be compiled against that.
    },
  },
  solidity: {
    version: "0.6.12",
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
