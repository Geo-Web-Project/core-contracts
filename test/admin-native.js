const { assert } = require("chai");
const { ethers, upgrades } = require("hardhat");

const BigNumber = ethers.BigNumber;

describe("GeoWebAdminNative_v0", async () => {
  let accounts;

  function perYearToPerSecondRate(annualRate) {
    return {
      numerator: annualRate * 100,
      denominator: 60 * 60 * 24 * 365 * 100,
    };
  }

  async function makeAdminContract() {
    let rate = perYearToPerSecondRate(0.1);
    let minInitialValue = ethers.utils.parseEther("10");
    let minClaimExpiration = 60 * 60 * 24 * 365; // 365 days
    let minExpiration = 60 * 60 * 24 * 14; // 14 days
    let maxExpiration = 60 * 60 * 24 * 730; // 730 days
    let ductionAuctionLength = BigNumber.from(60 * 60 * 24 * 7);

    const GeoWebAdminNative_v0 = await ethers.getContractFactory(
      "GeoWebAdminNative_v0"
    );
    const adminContract = await upgrades.deployProxy(GeoWebAdminNative_v0, [
      minInitialValue,
      minClaimExpiration,
      minExpiration,
      maxExpiration,
      rate.numerator,
      rate.denominator,
      ductionAuctionLength,
    ]);
    await adminContract.deployed();

    return adminContract;
  }

  async function getContracts(adminContract) {
    const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
    let parcelContract = await GeoWebParcel.deploy(adminContract.address);
    await parcelContract.deployed();

    const ERC721License = await ethers.getContractFactory("ERC721License");
    const licenseContract = await upgrades.deployProxy(ERC721License, [
      adminContract.address,
    ]);
    await licenseContract.deployed();

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    return { parcelContract, licenseContract };
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should keep state on upgrade", async () => {
    const GeoWebAdminNative_v0 = await ethers.getContractFactory(
      "GeoWebAdminNative_v0"
    );
    let minInitialValue = ethers.utils.parseEther("10");
    let adminContract = await makeAdminContract();

    const adminContract2 = await upgrades.upgradeProxy(
      adminContract.address,
      GeoWebAdminNative_v0
    );
    await adminContract2.deployed();

    let _minInitialValue = await adminContract2.minInitialValue();
    assert.equal(_minInitialValue.toString(), minInitialValue.toString());
  });

  it("should only allow owner to set license contract", async () => {
    let adminContract = await makeAdminContract();
    const ERC721License = await ethers.getContractFactory("ERC721License");
    let license = await upgrades.deployProxy(ERC721License, [
      adminContract.address,
    ]);
    await license.deployed();

    var err;
    try {
      await adminContract
        .connect(accounts[1])
        .setLicenseContract(license.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setLicenseContract(license.address);
  });

  it("should only allow owner to set parcel contract", async () => {
    let adminContract = await makeAdminContract();

    const GeoWebParcel = await ethers.getContractFactory("GeoWebParcel");
    let parcel = await GeoWebParcel.deploy(adminContract.address);
    await parcel.deployed();

    var err;
    try {
      await adminContract
        .connect(accounts[1])
        .setParcelContract(parcel.address);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await adminContract.setParcelContract(parcel.address);
  });

  it("should claim land and collect initial fee", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let originalBalance1 = await ethers.provider.getBalance(
      accounts[1].address
    );

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );

    let receipt = await result.wait();

    let gasFee = BigNumber.from(
      ethers.utils.parseUnits(receipt.gasUsed.toString(), "gwei")
    );

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let parcel = await parcelContract.getLandParcel(parcelId);
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    assert(parcel != null, "Parcel was not minted");
    assert(
      (await licenseContract.ownerOf(parcelId)) == accounts[1].address,
      "License was not minted correctly"
    );
    assert.equal(
      (await ethers.provider.getBalance(accounts[1].address)).toString(),
      originalBalance1.sub(gasFee).sub(ethers.utils.parseEther("1")).toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await adminContract.pendingWithdrawals(accounts[0].address)).toString(),
      ethers.utils.parseEther("1"),
      "Fee was not deposited into owner's withdrawl account"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).value.eq(
        ethers.utils.parseEther("10")
      ),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
        block.timestamp + 60 * 60 * 24 * 365,
      "Expiration was not saved correctly"
    );
  });

  it("should claim land if expiration == 2 years", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("2"),
        }
      );

    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let block = await ethers.provider.getBlock(receipt.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
        block.timestamp + 60 * 60 * 24 * 365 * 2,
      "Expiration was not saved correctly"
    );
  });

  it("should fail to claim land if below minimum value", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    var err;
    try {
      let result = await adminContract
        .connect(accounts[1])
        .claim(
          accounts[1].address,
          coord,
          [BigNumber.from(0)],
          ethers.utils.parseEther("9"),
          "",
          {
            value: ethers.utils.parseEther("1"),
          }
        );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should fail to claim land if expiration < 1 year", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    var err;
    try {
      let result = await adminContract
        .connect(accounts[1])
        .claim(
          accounts[1].address,
          coord,
          [BigNumber.from(0)],
          ethers.utils.parseEther("10"),
          "",
          {
            value: ethers.utils.parseEther("0.9"),
          }
        );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be at least minClaimExpiration"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should fail to claim land if expiration > 2 years", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    var err;
    try {
      let result = await adminContract
        .connect(accounts[1])
        .claim(
          accounts[1].address,
          coord,
          [BigNumber.from(0)],
          ethers.utils.parseEther("10"),
          "",
          {
            value: ethers.utils.parseEther("2.1"),
          }
        );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be less than or equal to maxExpiration"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should only allow license holder to update value", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );

    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];

    var err;
    try {
      await adminContract
        .connect(accounts[0])
        .updateValue(parcelId, ethers.utils.parseEther("30"));
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("Only holder of license can call this function"),
      "Expected an error but did not get one"
    );
  });

  it("should update to higher value and collect fee", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result1 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("30"));
    let receipt1 = await result1.wait();

    let block = await ethers.provider.getBlock(receipt1.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value.eq(
        ethers.utils.parseEther("30")
      ),
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
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("20"),
        "",
        {
          value: ethers.utils.parseEther("2"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result1 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("10"));
    let receipt1 = await result1.wait();

    let block = await ethers.provider.getBlock(receipt1.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value.eq(
        ethers.utils.parseEther("10")
      ),
      "Self-assessed value was not saved correctly"
    );
    assert(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
        block.timestamp ==
        (originalExpiration - block.timestamp) * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should accept additional payment without value change", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let originalBalance1 = await ethers.provider.getBalance(
      accounts[1].address
    );

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    let gasFee1 = BigNumber.from(
      ethers.utils.parseUnits(receipt.gasUsed.toString(), "gwei")
    );

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result2 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("10"), {
        value: ethers.utils.parseEther("1"),
      });
    let receipt2 = await result2.wait();

    let gasFee2 = BigNumber.from(
      ethers.utils.parseUnits(receipt2.gasUsed.toString(), "gwei")
    );

    let perSecondFee = BigNumber.from(ethers.utils.parseEther("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = BigNumber.from(
      ethers.utils.parseEther("1")
    ).div(perSecondFee);

    assert.equal(
      (await ethers.provider.getBalance(accounts[1].address)).toString(),
      originalBalance1
        .sub(gasFee1)
        .sub(gasFee2)
        .sub(ethers.utils.parseEther("2"))
        .toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await adminContract.pendingWithdrawals(accounts[0].address)).toString(),
      ethers.utils.parseEther("2"),
      "Fee was not deposited into owner's withdrawl account"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      ethers.utils.parseEther("10"),
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
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let originalBalance1 = await ethers.provider.getBalance(
      accounts[1].address
    );

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    let gasFee1 = BigNumber.from(
      ethers.utils.parseUnits(receipt.gasUsed.toString(), "gwei")
    );

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Update value
    let result1 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("20"), {
        value: ethers.utils.parseEther("1"),
      });
    let receipt1 = await result1.wait();

    let gasFee2 = BigNumber.from(
      ethers.utils.parseUnits(receipt1.gasUsed.toString(), "gwei")
    );

    let block = await ethers.provider.getBlock(receipt1.blockNumber);

    let perSecondFee = BigNumber.from(ethers.utils.parseEther("20"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = BigNumber.from(
      ethers.utils.parseEther("1")
    ).div(perSecondFee);

    assert.equal(
      (await ethers.provider.getBalance(accounts[1].address)).toString(),
      originalBalance1
        .sub(gasFee1)
        .sub(gasFee2)
        .sub(ethers.utils.parseEther("2"))
        .toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await adminContract.pendingWithdrawals(accounts[0].address)).toString(),
      ethers.utils.parseEther("2"),
      "Fee was not deposited into owner's withdrawl account"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      ethers.utils.parseEther("20"),
      "Self-assessed value was not saved correctly"
    );

    let expectedDuration = Math.floor(
      (originalExpiration - block.timestamp) / 2
    );
    assert.equal(
      (
        await adminContract.licenseInfo(parcelId)
      ).expirationTimestamp.toString(),
      additionlPaymentTimeBalance
        .add(expectedDuration)
        .add(BigNumber.from(block.timestamp))
        .toString(),
      "Expiration was not updated correctly"
    );
  });

  it("should cap additional payment at 2 years", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let originalBalance1 = await ethers.provider.getBalance(
      accounts[1].address
    );

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    let gasFee1 = BigNumber.from(
      ethers.utils.parseUnits(receipt.gasUsed.toString(), "gwei")
    );

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    let result1 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("10"), {
        value: ethers.utils.parseEther("5"),
      });
    let receipt1 = await result1.wait();

    let gasFee2 = BigNumber.from(
      ethers.utils.parseUnits(receipt1.gasUsed.toString(), "gwei")
    );

    let block = await ethers.provider.getBlock(receipt1.blockNumber);

    let perSecondFee = BigNumber.from(ethers.utils.parseEther("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let additionlPaymentTimeBalance = BigNumber.from(
      ethers.utils.parseEther("1")
    ).div(perSecondFee);

    assert.equal(
      (await ethers.provider.getBalance(accounts[1].address)).toString(),
      BigNumber.from(originalBalance1)
        .sub(gasFee1)
        .sub(gasFee2)
        .sub(BigNumber.from(ethers.utils.parseEther("6")))
        .toString(),
      "Fee was not withdrawn"
    );
    assert.equal(
      (await adminContract.pendingWithdrawals(accounts[0].address)).toString(),
      ethers.utils.parseEther("6"),
      "Fee was not deposited into owner's withdrawl account"
    );

    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      ethers.utils.parseEther("10"),
      "Self-assessed value was not saved correctly"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).expirationTimestamp,
      block.timestamp + 60 * 60 * 24 * 365 * 2,
      "Expiration was not updated correctly"
    );
  });

  it("should fail to update value if license does not exist", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    var err;
    try {
      await adminContract
        .connect(accounts[1])
        .updateValue(BigNumber.from(0), ethers.utils.parseEther("30"));
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("ERC721: owner query for nonexistent token"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to update value if below minimum value", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];

    var err;
    try {
      await adminContract
        .connect(accounts[1])
        .updateValue(parcelId, ethers.utils.parseEther("5"));
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("New value must be >= the required minimum value"),
      "Expected an error but did not get one"
    );
  });

  it("should fail to update value if expiration < 2 weeks", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];

    var err;
    try {
      await adminContract
        .connect(accounts[1])
        .updateValue(parcelId, ethers.utils.parseEther("1000"));
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Resulting expiration date must be at least minExpiration"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should update value even if expiration > 2 years", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("100"),
        "",
        {
          value: ethers.utils.parseEther("10"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];

    // Update value
    let result1 = await adminContract
      .connect(accounts[1])
      .updateValue(parcelId, ethers.utils.parseEther("10"));
    let receipt1 = await result1.wait();

    let block = await ethers.provider.getBlock(receipt1.blockNumber);

    assert(
      (await adminContract.licenseInfo(parcelId)).value.eq(
        ethers.utils.parseEther("10")
      ),
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
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let originalBalance2 = await ethers.provider.getBalance(
      accounts[2].address
    );

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Purchase license
    let maxPurchasePrice = ethers.utils.parseEther("11");
    let result1 = await adminContract
      .connect(accounts[2])
      .purchaseLicense(
        parcelId,
        maxPurchasePrice,
        ethers.utils.parseEther("30"),
        "new-doc-id",
        {
          value: maxPurchasePrice,
        }
      );
    let receipt1 = await result1.wait();

    let gasFee2 = BigNumber.from(
      ethers.utils.parseUnits(receipt1.gasUsed.toString(), "gwei")
    );

    let block = await ethers.provider.getBlock(receipt1.blockNumber);
    let perSecondFee = BigNumber.from(ethers.utils.parseEther("10"))
      .mul(await adminContract.perSecondFeeNumerator())
      .div(await adminContract.perSecondFeeDenominator());
    let feeBalance = perSecondFee.mul(originalExpiration - block.timestamp);
    let additionlPaymentTimeBalance = BigNumber.from(
      ethers.utils.parseEther("1")
    )
      .sub(feeBalance)
      .div(perSecondFee);

    assert.equal(
      await licenseContract.ownerOf(parcelId),
      accounts[2].address,
      "License did not transfer ownership"
    );
    assert.equal(
      (await ethers.provider.getBalance(accounts[2].address)).toString(),
      BigNumber.from(originalBalance2)
        .sub(gasFee2)
        .sub(BigNumber.from(ethers.utils.parseEther("11")))
        .toString(),
      "Payment was not taken from buyer"
    );
    assert.equal(
      (await adminContract.pendingWithdrawals(accounts[1].address)).toString(),
      BigNumber.from(ethers.utils.parseEther("10")).add(feeBalance),
      "Payment was not sent to seller"
    );
    assert.equal(
      (await adminContract.licenseInfo(parcelId)).value.toString(),
      ethers.utils.parseEther("30"),
      "Self-assessed value was not saved correctly"
    );

    let expectedDuration = Math.floor(
      (originalExpiration - block.timestamp) / 3
    );
    assert.equal(
      (
        await adminContract.licenseInfo(parcelId)
      ).expirationTimestamp.toString(),
      additionlPaymentTimeBalance
        .add(expectedDuration)
        .add(BigNumber.from(block.timestamp))
        .toString(),
      "Expiration was not updated correctly"
    );
  });

  it("should fail to purchase license from owner if max purchase price is too low", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Purchase license
    let maxPurchasePrice = ethers.utils.parseEther("10");

    var err;
    try {
      await adminContract
        .connect(accounts[2])
        .purchaseLicense(
          parcelId,
          maxPurchasePrice,
          ethers.utils.parseEther("30"),
          "new-doc-id",
          {
            value: maxPurchasePrice,
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

  it("should fail to purchase license from owner if sent value is too low", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    // Claim land
    let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    let result = await adminContract
      .connect(accounts[1])
      .claim(
        accounts[1].address,
        coord,
        [BigNumber.from(0)],
        ethers.utils.parseEther("10"),
        "",
        {
          value: ethers.utils.parseEther("1"),
        }
      );
    let receipt = await result.wait();

    // Get parcel and block
    let parcelId = receipt.logs[receipt.logs.length - 2].topics[1];
    let originalExpiration = (await adminContract.licenseInfo(parcelId))
      .expirationTimestamp;

    // Purchase license
    let maxPurchasePrice = ethers.utils.parseEther("11");

    var err;
    try {
      await adminContract
        .connect(accounts[2])
        .purchaseLicense(
          parcelId,
          maxPurchasePrice,
          ethers.utils.parseEther("30"),
          "new-doc-id",
          {
            value: ethers.utils.parseEther("10"),
          }
        );
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes(
        "Message value must be greater than or equal to the total buy price"
      ),
      "Expected an error but did not get one"
    );
  });

  it("should calculate buy price during auction", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let buyPrice = await adminContract._calculateTotalBuyPrice(
      10000,
      100,
      312400
    );
    assert.equal(
      buyPrice.toString(),
      BigNumber.from(50).toString(),
      "Buy price is not correct"
    );
  });

  it("should calculate buy price after auction ends", async () => {
    let adminContract = await makeAdminContract();
    let { parcelContract, licenseContract } = await getContracts(adminContract);

    let buyPrice = await adminContract._calculateTotalBuyPrice(
      10000,
      100,
      700000
    );
    assert.equal(
      buyPrice.toString(),
      BigNumber.from(0).toString(),
      "Buy price is not correct"
    );
  });
});
