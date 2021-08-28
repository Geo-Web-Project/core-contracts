const { ethers, upgrades } = require("hardhat");

function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

async function main() {
  let rate = perYearToPerSecondRate(0.1);
  let minInitialValue = ethers.utils.parseEther("0.1");
  let minClaimExpiration = 60 * 60 * 24 * 365; // 365 days
  let minExpiration = 60 * 60 * 24; // 1 day
  let maxExpiration = 60 * 60 * 24 * 730; // 730 days
  let ductionAuctionLength = 60 * 60 * 24 * 7; // 7 days

  const GeoWebAdminNative_v0 = await ethers.getContractFactory(
    "GeoWebAdminNative_v0"
  );
  const instance = await upgrades.deployProxy(GeoWebAdminNative_v0, [
    minInitialValue,
    minClaimExpiration,
    minExpiration,
    maxExpiration,
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
