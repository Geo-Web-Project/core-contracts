const GeoWebAdmin = artifacts.require("GeoWebAdmin");
const ERC20Mock = artifacts.require("ERC20Mock");

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

module.exports = function (deployer, network, accounts) {
  return deployer.deploy(ERC20Mock).then(async (erc20Mock) => {
    let rate = perYearToPerSecondRate(0.1);

    await deployer.deploy(
      GeoWebAdmin,
      erc20Mock.address,
      web3.utils.toWei("10"),
      rate.numerator,
      rate.denominator
    );
  });
};
