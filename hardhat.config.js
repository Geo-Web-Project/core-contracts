/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  networks: {
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
  },
  solidity: {
    version: "0.6.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
