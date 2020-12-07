const BN = require("bn.js");
const GeoWebAdmin = artifacts.require("GeoWebAdmin");
const ERC20Mock = artifacts.require("ERC20Mock");
// const HDWalletProvider = require("@truffle/hdwallet-provider");

// let provider = new HDWalletProvider(
//   process.env.DEV_PRIVATE_KEY,
//   `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
// );

function makePathPrefix(length) {
  return new BN(length).shln(256 - 8);
}

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

async function claim() {
  // Sample coordinate near Mount Rainier
  let coord = new BN("11662262144156956", 10);

  let adminContract = await GeoWebAdmin.deployed();
  let paymentTokenContract = await ERC20Mock.deployed();

  let accounts = await web3.eth.getAccounts();
  // Mint some tokens
  await paymentTokenContract.mockMint(accounts[0], web3.utils.toWei("10"));
  await paymentTokenContract.approve(
    adminContract.address,
    web3.utils.toWei("10"),
    {
      from: accounts[0],
    }
  );

  let count = 100;
  var paths = [];
  var path = new BN(0);
  for (let i = 1; i < count; i++) {
    var direction;
    if (i % 16 == 0) {
      // North
      direction = new BN("00", 2);
    } else if (Math.floor(i / 16) % 2 == 0) {
      // East
      direction = new BN("10", 2);
    } else {
      // West
      direction = new BN("11", 2);
    }
    path = direction.shln(i * 2).or(path.shrn(2));

    if (i % 124 == 0) {
      paths.push(makePathPrefix(124).or(path));
      path = new BN(0);
    }
  }

  paths.push(makePathPrefix((count % 124) - 1).or(path));

  await adminContract.claim(
    accounts[0],
    coord,
    paths,
    web3.utils.toWei("10"),
    web3.utils.toWei("1"),
    { from: accounts[0] }
  );
}

module.exports = function (callback) {
  claim()
    .then(() => callback())
    .catch((error) => callback(error));
};
