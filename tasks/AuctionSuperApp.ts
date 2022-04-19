import { task, types } from "hardhat/config";

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

task("deploy:super-app", "Deploy the AuctionSuperApp")
  .addParam("host", "Address of Superfluid host")
  .addParam("acceptedToken", "Address of SuperToken to accept for payment")
  .addParam("beneficiary", "Address of beneficiary")
  .addParam("licenseAddress", "Address of ERC721 License")
  .addParam("claimerAddress", "Address of claimer")
  .addParam("reclaimerAddress", "Address of reclaimer")
  .addParam(
    "annualFeeRate",
    "Annual rate for contribution fee. 10% -> 0.1",
    undefined,
    types.float
  )
  .addParam(
    "penaltyRate",
    "Penalty rate for rejecting bids",
    undefined,
    types.float
  )
  .addParam(
    "bidPeriodLengthInSeconds",
    "Length of bid period in seconds",
    undefined,
    types.int
  )
  .setAction(
    async (
      {
        host,
        acceptedToken,
        beneficiary,
        licenseAddress,
        claimerAddress,
        reclaimerAddress,
        annualFeeRate,
        penaltyRate,
        bidPeriodLengthInSeconds,
      },
      hre
    ) => {
      const perSecondFee = perYearToPerSecondRate(annualFeeRate);
      const penaltyNumerator = penaltyRate * 100;
      const penaltyDenominator = 100;

      const factory = await hre.ethers.getContractFactory("AuctionSuperApp");
      const superApp = await factory.deploy(
        host,
        acceptedToken,
        beneficiary,
        licenseAddress,
        claimerAddress,
        reclaimerAddress,
        perSecondFee.numerator,
        perSecondFee.denominator,
        penaltyNumerator,
        penaltyDenominator,
        bidPeriodLengthInSeconds
      );
      await superApp.deployed();

      console.log("AuctionSuperApp deployed to:", superApp.address);

      return superApp.address;
    }
  );
