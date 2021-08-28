const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

const ADMIN_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

function makePathPrefix(length) {
  return BigNumber.from(length).shl(256 - 8);
}

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

async function claim() {
  let adminContract = await ethers.getContractAt(
    "GeoWebAdminNative_v0",
    ADMIN_CONTRACT_ADDRESS
  );

  const signer = await ethers.getSigner();

  // Sample coordinate near Mount Rainier
  let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

  const res = await adminContract.claim(
    signer.address,
    coord,
    [BigNumber.from(0)],
    ethers.utils.parseEther("0.1"),
    "",
    { value: ethers.utils.parseEther("0.01") }
  );

  const receipt = await res.wait();
  console.log(receipt);
}

claim()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
