function perYearToPerSecondRate(annualRate) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

task("deploy:accountant", "Deploy the Accountant").setAction(async () => {
  const Accountant = await ethers.getContractFactory("Accountant");
  const accountant = await Accountant.deploy();

  console.log("Accountant deployed to:", accountant.address);

  return accountant.address;
});

task("config:accountant")
  .addParam("contract", "Address of deployed Accountant contract")
  .addOptionalParam(
    "annualFeeRate",
    "Annual rate for contribution fee. 10% -> 0.1",
    undefined,
    types.float
  )
  .addOptionalParam(
    "validator",
    "Where to find if a license's account is still valid"
  )
  .setAction(async ({ contract, annualFeeRate, validator }) => {
    if (!annualFeeRate && !validator) {
      console.log("Nothing to configure. See options");
      return;
    }

    const accountant = await ethers.getContractAt("Accountant", contract);

    if (annualFeeRate) {
      const { numerator, denominator } = perYearToPerSecondRate(annualFeeRate);
      await accountant.setPerSecondFee(numerator, denominator);
      console.log("Successfully set Accountant fee.");
    }

    if (validator) {
      await accountant.setValidator(validator);
      console.log("Successfully set Accountant validator.");
    }
  });
