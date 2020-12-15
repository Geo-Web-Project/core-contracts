const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdminNative_v0 = artifacts.require("GeoWebAdminNative_v0");

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

module.exports = async function (deployer, network, accounts) {
  let rate = perYearToPerSecondRate(0.1);

  return await deployProxy(
    GeoWebAdminNative_v0,
    [web3.utils.toWei("10"), rate.numerator, rate.denominator],
    { deployer, unsafeAllowCustomTypes: true }
  );
};
