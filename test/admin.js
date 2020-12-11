const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdmin_v0 = artifacts.require("GeoWebAdmin_v0");
const ERC721License = artifacts.require("ERC721License");
const GeoWebParcel = artifacts.require("GeoWebParcel");
const ERC20Mock = artifacts.require("ERC20Mock");

const BN = require("bn.js");

contract("GeoWebAdmin_v0", async (accounts) => {
  function perYearToPerSecondRate(annualRate) {
    return {
      numerator: annualRate * 100,
      denominator: 60 * 60 * 24 * 365 * 100,
    };
  }

  it("should keep state on upgrade", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await deployProxy(
      GeoWebAdmin_v0,
      [
        paymentTokenContract.address,
        minInitialValue,
        rate.numerator,
        rate.denominator,
      ],
      { unsafeAllowCustomTypes: true }
    );

    let adminContract2 = await upgradeProxy(
      adminContract.address,
      GeoWebAdmin_v0,
      { unsafeAllowCustomTypes: true }
    );

    let _minInitialValue = await adminContract2.minInitialValue();
    assert.equal(_minInitialValue, minInitialValue);
  });

  it("should only allow owner to set license contract", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let license = await ERC721License.new(adminContract.address);

    var err;
    try {
      await adminContract.setLicenseContract(license.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setLicenseContract(license.address, {
      from: accounts[0],
    });
  });

  it("should only allow owner to set parcel contract", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let parcel = await GeoWebParcel.new(adminContract.address);

    var err;
    try {
      await adminContract.setParcelContract(parcel.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setParcelContract(parcel.address, {
      from: accounts[0],
    });
  });

  it("should claim land and collect initial fee", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let parcel = await parcelContract.getLandParcel(parcelId);
    let block = await web3.eth.getBlock(result.receipt.blockNumber);

    assert(parcel != null, "Parcel was not minted");
    assert(
      (await licenseContract.ownerOf(parcelId)) == accounts[1],
      "License was not minted correctly"
    );
    assert(
      (await paymentTokenContract.balanceOf(accounts[1])) ==
        web3.utils.toWei("9"),
      "Fee was not withdrawn"
    );
    assert(
      (await paymentTokenContract.balanceOf(accounts[0])) ==
        web3.utils.toWei("1"),
      "Fee was not deposited"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).value ==
        web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
        block.timestamp + 60 * 60 * 24 * 365,
      "Expiration was not saved correctly"
    );
  });

  it("should claim land if expiration == 2 years", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("2"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let parcel = await parcelContract.getLandParcel(parcelId);
    let block = await web3.eth.getBlock(result.receipt.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
        block.timestamp + 60 * 60 * 24 * 365 * 2,
      "Expiration was not saved correctly"
    );
  });

  it("should fail to claim land if below minimum value", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("9"),
        web3.utils.toWei("1"),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should fail to claim land if expiration < 1 year", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("10"),
        web3.utils.toWei("0.9"),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should fail to claim land if expiration > 2 years", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("10"),
        web3.utils.toWei("2.1"),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should only allow license holder to update value", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

    var err;
    try {
      await adminContract.updateValue(
        parcelId,
        web3.utils.toWei("30"),
        new BN(0),
        {
          from: accounts[0],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Only holder of license can call this function"),
      "Expected an error but did not get one"
    );
  });

  it("should update to higher value and collect fee", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("30"),
      new BN(0),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value ==
        web3.utils.toWei("30"),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp ==
        (originalExpiration - block.timestamp) / 3,
      "Expiration was not updated correctly"
    );
  });

  it("should update to lower value and collect fee", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("20"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("20"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("20"),
      web3.utils.toWei("2"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("10"),
      new BN(0),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value ==
        web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp ==
        (originalExpiration - block.timestamp) * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should fail to update value if license does not exist", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    var err;
    try {
      await adminContract.updateValue(
        new BN(0),
        web3.utils.toWei("30"),
        new BN(0),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("ERC721: owner query for nonexistent token"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to update value if below minimum value", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

    var err;
    try {
      await adminContract.updateValue(
        parcelId,
        web3.utils.toWei("5"),
        new BN(0),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("New value must be >= the required minimum value"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to update value if expiration < 2 weeks", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

    var err;
    try {
      await adminContract.updateValue(
        parcelId,
        web3.utils.toWei("1000"),
        new BN(0),
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be at least 14 days"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should update value even if expiration > 2 years", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await GeoWebAdmin_v0.new();
    await adminContract.initialize(
      paymentTokenContract.address,
      minInitialValue,
      rate.numerator,
      rate.denominator
    );
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("100"),
      {
        from: accounts[1],
      }
    );

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("100"),
      web3.utils.toWei("10"),
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

    // Update value
    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("10"),
      new BN(0),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value ==
        web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp +
        60 * 60 * 24 * 365 * 2,
      "Expiration was not updated correctly"
    );
  });
});
