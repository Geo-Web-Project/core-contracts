const { ethers, upgrades } = require("hardhat");

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

async function main() {
  let rate = perYearToPerSecondRate(0.1);
  let ductionAuctionLength = 60 * 60 * 24 * 7;

  const GeoWebAdminNative_v0 = await ethers.getContractFactory(
    "GeoWebAdminNative_v0"
  );
  const instance = await upgrades.deployProxy(GeoWebAdminNative_v0, [
    ethers.utils.parseEther("0.1"),
    rate.numerator,
    rate.denominator,
    ductionAuctionLength,
  ]);
  await instance.deployed();

  console.log("GeoWebAdminNative_v0 deployed to:", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
