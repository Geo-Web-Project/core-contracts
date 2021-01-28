const { upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const ERC721License = artifacts.require("ERC721License");

module.exports = async function (deployer) {
  const existing = await ERC721License.deployed();
  await upgradeProxy(existing.address, ERC721License, {
    deployer,
    unsafeAllowCustomTypes: true,
  });
};
