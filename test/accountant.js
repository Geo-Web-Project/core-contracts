const { assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

describe("Accountant", async () => {
  let accounts;

  function perYearToPerSecondRate(annualRate) {
    return {
      numerator: annualRate * 100,
      denominator: 60 * 60 * 24 * 365 * 100,
    };
  }

  async function buildAccountant() {
    const Accountant = await ethers.getContractFactory("Accountant");
    const accountant = await Accountant.deploy();
    await accountant.deployed();

    return accountant;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should only allow admin to set fee", async () => {
    let accountant = await buildAccountant();

    var err;
    try {
      await accountant
        .connect(accounts[1])
        .setPerSecondFee(BigNumber.from(1), BigNumber.from(2));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await accountant.setPerSecondFee(BigNumber.from(1), BigNumber.from(2));

    const perSecondFeeNumerator = await accountant.perSecondFeeNumerator();
    const perSecondFeeDenominator = await accountant.perSecondFeeDenominator();
    assert(
      perSecondFeeNumerator.eq(BigNumber.from(1)),
      "Numerator was not updated"
    );

    assert(
      perSecondFeeDenominator.eq(BigNumber.from(2)),
      "Denominator was not updated"
    );
  });

  it("should only allow admin to set validator", async () => {
    let accountant = await buildAccountant();

    var err;
    try {
      await accountant.connect(accounts[1]).setValidator(accountant.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await accountant.setValidator(accountant.address);

    const validator = await accountant.validator();
    assert(validator == accountant.address, "Validator was not updated");
  });

  it("should only allow role MODIFY_CONTRIBUTION_ROLE to set contribution rate", async () => {
    let accountant = await buildAccountant();
    let MODIFY_CONTRIBUTION_ROLE = await accountant.MODIFY_CONTRIBUTION_ROLE();

    var err;
    try {
      await accountant
        .connect(accounts[1])
        .setContributionRate(BigNumber.from(1), BigNumber.from(1));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await accountant.grantRole(MODIFY_CONTRIBUTION_ROLE, accounts[1].address);

    await accountant
      .connect(accounts[1])
      .setContributionRate(BigNumber.from(1), BigNumber.from(1));

    const rate = await accountant.contributionRates(BigNumber.from(1));
    assert(rate.eq(1), "Contribution rate was not updated");
  });

  it("should call validator on isValid", async () => {
    let accountant = await buildAccountant();

    const MockLicenseValidator = await ethers.getContractFactory(
      "MockLicenseValidator"
    );
    const validator = await MockLicenseValidator.deploy(10);
    await validator.deployed();

    await accountant.setValidator(validator.address);

    assert(await accountant.isValid(10), "Did not call mock validator");
    assert(
      (await accountant.isValid(1)) == false,
      "Did not call mock validator"
    );
  });
});
