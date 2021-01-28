const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const GeoWebAdminERC20_v0 = artifacts.require("GeoWebAdminERC20_v0");
const ERC721License = artifacts.require("ERC721License");
const GeoWebParcel = artifacts.require("GeoWebParcel");
const ERC20Mock = artifacts.require("ERC20Mock");

const BN = require("bn.js");

contract("GeoWebAdminERC20_v0", async (accounts) => {
  function perYearToPerSecondRate(annualRate) {
    return {
      numerator: annualRate * 100,
      denominator: 60 * 60 * 24 * 365 * 100,
    };
  }

  async function getContracts() {
    let adminContract = await GeoWebAdminERC20_v0.deployed();

    let paymentTokenContractAddress = await adminContract.paymentTokenContract();
    let paymentTokenContract = await ERC20Mock.at(paymentTokenContractAddress);

    let parcelContractAddress = await adminContract.parcelContract();
    let parcelContract = await GeoWebParcel.at(parcelContractAddress);

    let licenseContractAddress = await adminContract.licenseContract();
    let licenseContract = await ERC721License.at(licenseContractAddress);

    return {
      adminContract: adminContract,
      paymentTokenContract: paymentTokenContract,
      parcelContract: parcelContract,
      licenseContract: licenseContract,
    };
  }

  it("should keep state on upgrade", async () => {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = web3.utils.toWei("10");
    let ductionAuctionLength = 60 * 60 * 24 * 7;

    let paymentTokenContract = await ERC20Mock.new();
    let adminContract = await deployProxy(
      GeoWebAdminERC20_v0,
      [
        paymentTokenContract.address,
        minInitialValue,
        rate.numerator,
        rate.denominator,
        ductionAuctionLength,
      ],
      { unsafeAllowCustomTypes: true }
    );

    let adminContract2 = await upgradeProxy(
      adminContract.address,
      GeoWebAdminERC20_v0,
      { unsafeAllowCustomTypes: true }
    );

    let _minInitialValue = await adminContract2.minInitialValue();
    assert.equal(_minInitialValue, minInitialValue);
  });

  it("should only allow owner to set license contract", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    var err;
    try {
      await adminContract.setLicenseContract(licenseContract.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setLicenseContract(licenseContract.address, {
      from: accounts[0],
    });
  });

  it("should only allow owner to set parcel contract", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    var err;
    try {
      await adminContract.setParcelContract(parcelContract.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setParcelContract(parcelContract.address, {
      from: accounts[0],
    });
  });

  it("should claim land and collect initial fee", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Mint and approve tokens
    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("1000"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("1000"),
      {
        from: accounts[1],
      }
    );

    let startingBalance0 = await paymentTokenContract.balanceOf(accounts[0]);
    let startingBalance1 = await paymentTokenContract.balanceOf(accounts[1]);

    // Claim land
    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
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
        startingBalance1.sub(new BN(web3.utils.toWei("1"))).toString(),
      "Fee was not withdrawn"
    );
    assert(
      (await paymentTokenContract.balanceOf(accounts[0])) ==
        startingBalance0.add(new BN(web3.utils.toWei("1"))).toString(),
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
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await paymentTokenContract.mockMint(accounts[1], web3.utils.toWei("10"));

    // Claim land
    let coord = new BN(5).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("2"),
      "",
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
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(6).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("9"),
        web3.utils.toWei("1"),
        "",
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Initial value must be"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to claim land if expiration < 1 year", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(7).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("10"),
        web3.utils.toWei("0.9"),
        "",
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Resulting expiration date must be"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to claim land if expiration > 2 years", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(8).shln(32).or(new BN(33));

    var err;
    try {
      let result = await adminContract.claim(
        accounts[1],
        coord,
        [new BN(0)],
        web3.utils.toWei("10"),
        web3.utils.toWei("2.1"),
        "",
        {
          from: accounts[1],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Resulting expiration date must be"),
      "Expected an error but did not get one"
    );
  });

  it("should only allow license holder to update value", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Get parcel and block
    let parcelId = new BN(1);

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
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Get parcel and block
    let parcelId = new BN(1);
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
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp,
      Math.floor((originalExpiration - block.timestamp) / 3),
      "Expiration was not updated correctly"
    );
  });

  it("should update to lower value and collect fee", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    let parcelId = new BN(1);

    // Update value
    await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("20"),
      new BN(0),
      {
        from: accounts[1],
      }
    );

    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("10"),
      new BN(0),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value,
      web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp,
      (originalExpiration - block.timestamp) * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should accept additional payment without value change", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(12).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let startingBalance0 = await paymentTokenContract.balanceOf(accounts[0]);
    let startingBalance1 = await paymentTokenContract.balanceOf(accounts[1]);

    // Update value
    await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    let perSecondFee = new BN(web3.utils.toWei("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
      perSecondFee
    );

    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[1])).toString(),
      startingBalance1.sub(new BN(web3.utils.toWei("1"))).toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[0])).toString(),
      startingBalance0.add(new BN(web3.utils.toWei("1"))).toString(),
      "Fee was not deposited"
    );

    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert.equal(
      (
        await adminContract.licenseInfo(parcelId)
      ).expirationTimestamp.toString(),
      originalExpiration.add(additionlPaymentTimeBalance).toString(),
      "Expiration was not updated correctly"
    );
  });

  it("should accept additional payment with value change", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(13).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let startingBalance0 = await paymentTokenContract.balanceOf(accounts[0]);
    let startingBalance1 = await paymentTokenContract.balanceOf(accounts[1]);

    // Update value
    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("20"),
      web3.utils.toWei("1"),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    let perSecondFee = new BN(web3.utils.toWei("20"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
      perSecondFee
    );

    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[1])).toString(),
      startingBalance1.sub(new BN(web3.utils.toWei("1"))).toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[0])).toString(),
      startingBalance0.add(new BN(web3.utils.toWei("1"))).toString(),
      "Fee was not deposited"
    );

    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      web3.utils.toWei("20"),
      "Self-assessed value was not saved correctly"
    );

    let expectedDuration = (originalExpiration - block.timestamp) / 2;
    assert.equal(
      (
        await adminContract.licenseInfo(parcelId)
      ).expirationTimestamp.toString(),
      additionlPaymentTimeBalance
        .addn(expectedDuration)
        .add(new BN(block.timestamp))
        .toString(),
      "Expiration was not updated correctly"
    );
  });

  it("should cap additional payment at 2 years", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(11).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let startingBalance0 = await paymentTokenContract.balanceOf(accounts[0]);
    let startingBalance1 = await paymentTokenContract.balanceOf(accounts[1]);

    let result1 = await adminContract.updateValue(
      parcelId,
      web3.utils.toWei("10"),
      web3.utils.toWei("5"),
      {
        from: accounts[1],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);

    let perSecondFee = new BN(web3.utils.toWei("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
      perSecondFee
    );

    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[1])).toString(),
      startingBalance1.sub(new BN(web3.utils.toWei("5"))).toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[0])).toString(),
      startingBalance0.add(new BN(web3.utils.toWei("5"))).toString(),
      "Fee was not deposited"
    );

    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      web3.utils.toWei("10"),
      "Self-assessed value was not saved correctly"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp,
      block.timestamp + 60 * 60 * 24 * 365 * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should fail to update value if license does not exist", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    var err;
    try {
      await adminContract.updateValue(
        new BN(1000),
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
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Get parcel and block
    let parcelId = new BN(1);

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

  // it("should fail to update value if expiration < 2 weeks", async () => {
  //   const {
  //     adminContract,
  //     paymentTokenContract,
  //     licenseContract,
  //     parcelContract,
  //   } = await getContracts();

  //   // Claim land
  //   let coord = new BN(15).shln(32).or(new BN(33));
  //   let result = await adminContract.claim(
  //     accounts[1],
  //     coord,
  //     [new BN(0)],
  //     web3.utils.toWei("10"),
  //     web3.utils.toWei("1"),
  //     "",
  //     {
  //       from: accounts[1],
  //     }
  //   );

  //   // Get parcel and block
  //   let parcelId =
  //     result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

  //   var err;
  //   try {
  //     await adminContract.updateValue(
  //       parcelId,
  //       web3.utils.toWei("1000"),
  //       new BN(0),
  //       {
  //         from: accounts[1],
  //       }
  //     );
  //   } catch (error) {
  //     err = error;
  //   }

  //   assert(
  //     err.message.includes(
  //       "Resulting expiration date must be at least 14 days"
  //     ),
  //     "Expected an error but did not get one"
  //   );
  // });

  it("should update value even if expiration > 2 years", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(16).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("100"),
      web3.utils.toWei("10"),
      "",
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

  it("should purchase license from owner", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await paymentTokenContract.mockMint(accounts[2], web3.utils.toWei("100"));
    await paymentTokenContract.approve(
      adminContract.address,
      web3.utils.toWei("100"),
      {
        from: accounts[2],
      }
    );

    // Claim land
    let coord = new BN(17).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let startingBalance1 = await paymentTokenContract.balanceOf(accounts[1]);
    let startingBalance2 = await paymentTokenContract.balanceOf(accounts[2]);

    // Purchase license
    let maxPurchasePrice = web3.utils.toWei("20");
    let result1 = await adminContract.purchaseLicense(
      parcelId,
      maxPurchasePrice,
      web3.utils.toWei("30"),
      new BN(0),
      "test-cid-101",
      {
        from: accounts[2],
      }
    );

    let block = await web3.eth.getBlock(result1.receipt.blockNumber);
    let perSecondFee = new BN(web3.utils.toWei("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let feeBalance = perSecondFee.muln(originalExpiration - block.timestamp);

    const cid = await licenseContract.rootContent(parcelId);

    assert.equal(cid, "test-cid-101", "Root CID is incorrect");

    assert.equal(
      await licenseContract.ownerOf(parcelId),
      accounts[2],
      "License did not transfer ownership"
    );
    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[1])).toString(),
      startingBalance1
        .add(feeBalance)
        .add(new BN(web3.utils.toWei("10")))
        .toString(),
      "Payment was not sent to seller"
    );
    assert.equal(
      (await paymentTokenContract.balanceOf(accounts[2])).toString(),
      startingBalance2
        .sub(feeBalance)
        .sub(new BN(web3.utils.toWei("10")))
        .toString(),
      "Payment was not taken from buyer"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      web3.utils.toWei("30"),
      "Self-assessed value was not saved correctly"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp,
      Math.floor((originalExpiration - block.timestamp) / 3),
      "Expiration was not updated correctly"
    );
  });

  it("should fail to purchase license from owner if max purchase price is too low", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    // Claim land
    let coord = new BN(18).shln(32).or(new BN(33));
    let result = await adminContract.claim(
      accounts[1],
      coord,
      [new BN(0)],
      web3.utils.toWei("10"),
      web3.utils.toWei("1"),
      "",
      {
        from: accounts[1],
      }
    );

    // Get parcel and block
    let parcelId =
      result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Purchase license
    let maxPurchasePrice = web3.utils.toWei("10");

    var err;
    try {
      await adminContract.purchaseLicense(
        parcelId,
        maxPurchasePrice,
        web3.utils.toWei("30"),
        new BN(0),
        "",
        {
          from: accounts[2],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Current license for sale price + current fee balance is above max purchase price"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should calculate buy price during auction", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    let buyPrice = await adminContract._calculateTotalBuyPrice(
      10000,
      100,
      312400
    );
    assert.equal(
      buyPrice.toString(),
      new BN(50).toString(),
      "Buy price is not correct"
    );
  });

  it("should calculate buy price after auction ends", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();
    let buyPrice = await adminContract._calculateTotalBuyPrice(
      10000,
      100,
      700000
    );
    assert.equal(
      buyPrice.toString(),
      new BN(0).toString(),
      "Buy price is not correct"
    );
  });
});
