// const {
//   deployProxy,
//   upgradeProxy,
//   admin,
// } = require("@openzeppelin/truffle-upgrades");

// const GeoWebAdminNative_v0 = artifacts.require("GeoWebAdminNative_v0");
// const ERC721License = artifacts.require("ERC721License");
// const GeoWebParcel = artifacts.require("GeoWebParcel");
// const ERC20Mock = artifacts.require("ERC20Mock");

// const BN = require("bn.js");

// contract("GeoWebAdminNative_v0", async (accounts) => {
//   function perYearToPerSecondRate(annualRate) {
//     return {
//       numerator: annualRate * 100,
//       denominator: 60 * 60 * 24 * 365 * 100,
//     };
//   }

//   async function makeAdminContract() {
//     let rate = perYearToPerSecondRate(0.1);
//     let minInitialValue = web3.utils.toWei("10");
//     let ductionAuctionLength = new BN(60 * 60 * 24 * 7);

//     let adminContract = await GeoWebAdminNative_v0.new();
//     await adminContract.initialize(
//       minInitialValue,
//       rate.numerator,
//       rate.denominator,
//       ductionAuctionLength
//     );

//     return adminContract;
//   }

//   it("should keep state on upgrade", async () => {
//     let rate = perYearToPerSecondRate(0.1);
//     let minInitialValue = web3.utils.toWei("10");
//     let ductionAuctionLength = 60 * 60 * 24 * 7;

//     let adminContract = await deployProxy(
//       GeoWebAdminNative_v0,
//       [minInitialValue, rate.numerator, rate.denominator, ductionAuctionLength],
//       { unsafeAllowCustomTypes: true }
//     );

//     let adminContract2 = await upgradeProxy(
//       adminContract.address,
//       GeoWebAdminNative_v0,
//       { unsafeAllowCustomTypes: true }
//     );

//     let _minInitialValue = await adminContract2.minInitialValue();
//     assert.equal(_minInitialValue, minInitialValue);
//   });

//   it("should only allow owner to set license contract", async () => {
//     let adminContract = await makeAdminContract();
//     let license = await ERC721License.new(adminContract.address);

//     var err;
//     try {
//       await adminContract.setLicenseContract(license.address, {
//         from: accounts[1],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");

//     await adminContract.setLicenseContract(license.address, {
//       from: accounts[0],
//     });
//   });

//   it("should only allow owner to set parcel contract", async () => {
//     let adminContract = await makeAdminContract();
//     let parcel = await GeoWebParcel.new(adminContract.address);

//     var err;
//     try {
//       await adminContract.setParcelContract(parcel.address, {
//         from: accounts[1],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");

//     await adminContract.setParcelContract(parcel.address, {
//       from: accounts[0],
//     });
//   });

//   it("should claim land and collect initial fee", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     let originalBalance1 = await web3.eth.getBalance(accounts[1]);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee = new BN(
//       web3.utils.toWei(result.receipt.gasUsed.toString(), "gwei")
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let parcel = await parcelContract.getLandParcel(parcelId);
//     let block = await web3.eth.getBlock(result.receipt.blockNumber);

//     assert(parcel != null, "Parcel was not minted");
//     assert(
//       (await licenseContract.ownerOf(parcelId)) == accounts[1],
//       "License was not minted correctly"
//     );
//     assert.equal(
//       (await web3.eth.getBalance(accounts[1])).toString(),
//       new BN(originalBalance1)
//         .sub(gasFee)
//         .sub(new BN(web3.utils.toWei("1")))
//         .toString(),
//       "Fee was not withdrawn"
//     );
//     assert.equal(
//       (await adminContract.pendingWithdrawals(accounts[0])).toString(),
//       web3.utils.toWei("1"),
//       "Fee was not deposited into owner's withdrawl account"
//     );
//     assert(
//       (await adminContract.licenseInfo(parcelId)).value ==
//         web3.utils.toWei("10"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
//         block.timestamp + 60 * 60 * 24 * 365,
//       "Expiration was not saved correctly"
//     );
//   });

//   it("should claim land if expiration == 2 years", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("2"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let parcel = await parcelContract.getLandParcel(parcelId);
//     let block = await web3.eth.getBlock(result.receipt.blockNumber);

//     assert(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp ==
//         block.timestamp + 60 * 60 * 24 * 365 * 2,
//       "Expiration was not saved correctly"
//     );
//   });

//   it("should fail to claim land if below minimum value", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));

//     var err;
//     try {
//       let result = await adminContract.claim(
//         accounts[1],
//         coord,
//         [new BN(0)],
//         web3.utils.toWei("9"),
//         "",
//         {
//           from: accounts[1],
//           value: web3.utils.toWei("1"),
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");
//   });

//   it("should fail to claim land if expiration < 1 year", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));

//     var err;
//     try {
//       let result = await adminContract.claim(
//         accounts[1],
//         coord,
//         [new BN(0)],
//         web3.utils.toWei("10"),
//         "",
//         {
//           from: accounts[1],
//           value: web3.utils.toWei("0.9"),
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");
//   });

//   it("should fail to claim land if expiration > 2 years", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));

//     var err;
//     try {
//       let result = await adminContract.claim(
//         accounts[1],
//         coord,
//         [new BN(0)],
//         web3.utils.toWei("10"),
//         "",
//         {
//           from: accounts[1],
//           value: web3.utils.toWei("2.1"),
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");
//   });

//   it("should only allow license holder to update value", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

//     var err;
//     try {
//       await adminContract.updateValue(parcelId, web3.utils.toWei("30"), {
//         from: accounts[0],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes("Only holder of license can call this function"),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should update to higher value and collect fee", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Update value
//     let result1 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("30"),
//       {
//         from: accounts[1],
//       }
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);

//     assert(
//       (await adminContract.licenseInfo(parcelId)).value ==
//         web3.utils.toWei("30"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
//         block.timestamp,
//       Math.floor((originalExpiration - block.timestamp) / 3),
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should update to lower value and collect fee", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("20"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("2"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Update value
//     let result1 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("10"),
//       {
//         from: accounts[1],
//       }
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);

//     assert(
//       (await adminContract.licenseInfo(parcelId)).value ==
//         web3.utils.toWei("10"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
//         block.timestamp ==
//         (originalExpiration - block.timestamp) * 2,
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should accept additional payment without value change", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     let originalBalance1 = await web3.eth.getBalance(accounts[1]);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee1 = new BN(
//       web3.utils.toWei(result.receipt.gasUsed.toString(), "gwei")
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Update value
//     let result2 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("10"),
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee2 = new BN(
//       web3.utils.toWei(result2.receipt.gasUsed.toString(), "gwei")
//     );

//     let perSecondFee = new BN(web3.utils.toWei("10"))
//       .mul(await adminContract.perSecondFeeNumerator())
//       .div(await adminContract.perSecondFeeDenominator());
//     let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
//       perSecondFee
//     );

//     assert.equal(
//       (await web3.eth.getBalance(accounts[1])).toString(),
//       new BN(originalBalance1)
//         .sub(gasFee1)
//         .sub(gasFee2)
//         .sub(new BN(web3.utils.toWei("2")))
//         .toString(),
//       "Fee was not withdrawn"
//     );
//     assert.equal(
//       (await adminContract.pendingWithdrawals(accounts[0])).toString(),
//       web3.utils.toWei("2"),
//       "Fee was not deposited into owner's withdrawl account"
//     );
//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).value.toString(),
//       web3.utils.toWei("10"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert.equal(
//       (
//         await adminContract.licenseInfo(parcelId)
//       ).expirationTimestamp.toString(),
//       originalExpiration.add(additionlPaymentTimeBalance).toString(),
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should accept additional payment with value change", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     let originalBalance1 = await web3.eth.getBalance(accounts[1]);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee1 = new BN(
//       web3.utils.toWei(result.receipt.gasUsed.toString(), "gwei")
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Update value
//     let result1 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("20"),
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee2 = new BN(
//       web3.utils.toWei(result1.receipt.gasUsed.toString(), "gwei")
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);

//     let perSecondFee = new BN(web3.utils.toWei("20"))
//       .mul(await adminContract.perSecondFeeNumerator())
//       .div(await adminContract.perSecondFeeDenominator());
//     let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
//       perSecondFee
//     );

//     assert.equal(
//       (await web3.eth.getBalance(accounts[1])).toString(),
//       new BN(originalBalance1)
//         .sub(gasFee1)
//         .sub(gasFee2)
//         .sub(new BN(web3.utils.toWei("2")))
//         .toString(),
//       "Fee was not withdrawn"
//     );
//     assert.equal(
//       (await adminContract.pendingWithdrawals(accounts[0])).toString(),
//       web3.utils.toWei("2"),
//       "Fee was not deposited into owner's withdrawl account"
//     );
//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).value.toString(),
//       web3.utils.toWei("20"),
//       "Self-assessed value was not saved correctly"
//     );

//     let expectedDuration = (originalExpiration - block.timestamp) / 2;
//     assert.equal(
//       (
//         await adminContract.licenseInfo(parcelId)
//       ).expirationTimestamp.toString(),
//       additionlPaymentTimeBalance
//         .addn(expectedDuration)
//         .add(new BN(block.timestamp))
//         .toString(),
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should cap additional payment at 2 years", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     let originalBalance1 = await web3.eth.getBalance(accounts[1]);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee1 = new BN(
//       web3.utils.toWei(result.receipt.gasUsed.toString(), "gwei")
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     let result1 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("10"),
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("5"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee2 = new BN(
//       web3.utils.toWei(result1.receipt.gasUsed.toString(), "gwei")
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);

//     let perSecondFee = new BN(web3.utils.toWei("10"))
//       .mul(await adminContract.perSecondFeeNumerator())
//       .div(await adminContract.perSecondFeeDenominator());
//     let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1")).div(
//       perSecondFee
//     );

//     assert.equal(
//       (await web3.eth.getBalance(accounts[1])).toString(),
//       new BN(originalBalance1)
//         .sub(gasFee1)
//         .sub(gasFee2)
//         .sub(new BN(web3.utils.toWei("6")))
//         .toString(),
//       "Fee was not withdrawn"
//     );
//     assert.equal(
//       (await adminContract.pendingWithdrawals(accounts[0])).toString(),
//       web3.utils.toWei("6"),
//       "Fee was not deposited into owner's withdrawl account"
//     );

//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).value.toString(),
//       web3.utils.toWei("10"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp,
//       block.timestamp + 60 * 60 * 24 * 365 * 2,
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should fail to update value if license does not exist", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     var err;
//     try {
//       await adminContract.updateValue(new BN(0), web3.utils.toWei("30"), {
//         from: accounts[1],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes("ERC721: owner query for nonexistent token"),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should fail to update value if below minimum value", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

//     var err;
//     try {
//       await adminContract.updateValue(parcelId, web3.utils.toWei("5"), {
//         from: accounts[1],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes("New value must be >= the required minimum value"),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should fail to update value if expiration < 2 weeks", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

//     var err;
//     try {
//       await adminContract.updateValue(parcelId, web3.utils.toWei("1000"), {
//         from: accounts[1],
//       });
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes(
//         "Resulting expiration date must be at least 14 days"
//       ),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should update value even if expiration > 2 years", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("100"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("10"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];

//     // Update value
//     let result1 = await adminContract.updateValue(
//       parcelId,
//       web3.utils.toWei("10"),
//       {
//         from: accounts[1],
//       }
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);

//     assert(
//       (await adminContract.licenseInfo(parcelId)).value ==
//         web3.utils.toWei("10"),
//       "Self-assessed value was not saved correctly"
//     );
//     assert(
//       (await adminContract.licenseInfo(parcelId)).expirationTimestamp -
//         block.timestamp +
//         60 * 60 * 24 * 365 * 2,
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should purchase license from owner", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     let originalBalance2 = await web3.eth.getBalance(accounts[2]);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Purchase license
//     let maxPurchasePrice = web3.utils.toWei("11");
//     let result1 = await adminContract.purchaseLicense(
//       parcelId,
//       maxPurchasePrice,
//       web3.utils.toWei("30"),
//       {
//         from: accounts[2],
//         value: maxPurchasePrice,
//         gasPrice: web3.utils.toWei("1", "gwei"),
//       }
//     );

//     let gasFee2 = new BN(
//       web3.utils.toWei(result1.receipt.gasUsed.toString(), "gwei")
//     );

//     let block = await web3.eth.getBlock(result1.receipt.blockNumber);
//     let perSecondFee = new BN(web3.utils.toWei("10"))
//       .mul(await adminContract.perSecondFeeNumerator())
//       .div(await adminContract.perSecondFeeDenominator());
//     let feeBalance = perSecondFee.muln(originalExpiration - block.timestamp);
//     let additionlPaymentTimeBalance = new BN(web3.utils.toWei("1"))
//       .sub(feeBalance)
//       .div(perSecondFee);

//     assert.equal(
//       await licenseContract.ownerOf(parcelId),
//       accounts[2],
//       "License did not transfer ownership"
//     );
//     assert.equal(
//       (await web3.eth.getBalance(accounts[2])).toString(),
//       new BN(originalBalance2)
//         .sub(gasFee2)
//         .sub(new BN(web3.utils.toWei("11")))
//         .toString(),
//       "Payment was not taken from buyer"
//     );
//     assert.equal(
//       (await adminContract.pendingWithdrawals(accounts[1])).toString(),
//       new BN(web3.utils.toWei("10")).add(feeBalance),
//       "Payment was not sent to seller"
//     );
//     assert.equal(
//       (await adminContract.licenseInfo(parcelId)).value.toString(),
//       web3.utils.toWei("30"),
//       "Self-assessed value was not saved correctly"
//     );

//     let expectedDuration = Math.floor(
//       (originalExpiration - block.timestamp) / 3
//     );
//     assert.equal(
//       (
//         await adminContract.licenseInfo(parcelId)
//       ).expirationTimestamp.toString(),
//       additionlPaymentTimeBalance
//         .addn(expectedDuration)
//         .add(new BN(block.timestamp))
//         .toString(),
//       "Expiration was not updated correctly"
//     );
//   });

//   it("should fail to purchase license from owner if max purchase price is too low", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Purchase license
//     let maxPurchasePrice = web3.utils.toWei("10");

//     var err;
//     try {
//       await adminContract.purchaseLicense(
//         parcelId,
//         maxPurchasePrice,
//         web3.utils.toWei("30"),
//         {
//           from: accounts[2],
//           value: maxPurchasePrice,
//           gasPrice: web3.utils.toWei("1", "gwei"),
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes(
//         "Current license for sale price + current fee balance is above max purchase price"
//       ),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should fail to purchase license from owner if sent value is too low", async () => {
//     let adminContract = await makeAdminContract();
//     let licenseContract = await ERC721License.new(adminContract.address);
//     let parcelContract = await GeoWebParcel.new(adminContract.address);

//     await adminContract.setLicenseContract(licenseContract.address);
//     await adminContract.setParcelContract(parcelContract.address);

//     // Claim land
//     let coord = new BN(4).shln(32).or(new BN(33));
//     let result = await adminContract.claim(
//       accounts[1],
//       coord,
//       [new BN(0)],
//       web3.utils.toWei("10"),
//       "",
//       {
//         from: accounts[1],
//         value: web3.utils.toWei("1"),
//       }
//     );

//     // Get parcel and block
//     let parcelId =
//       result.receipt.rawLogs[result.receipt.rawLogs.length - 2].topics[1];
//     let originalExpiration = (await adminContract.licenseInfo(parcelId))
//       .expirationTimestamp;

//     // Purchase license
//     let maxPurchasePrice = web3.utils.toWei("11");

//     var err;
//     try {
//       await adminContract.purchaseLicense(
//         parcelId,
//         maxPurchasePrice,
//         web3.utils.toWei("30"),
//         {
//           from: accounts[2],
//           value: web3.utils.toWei("10"),
//           gasPrice: web3.utils.toWei("1", "gwei"),
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(
//       err.message.includes(
//         "Message value must be greater than or equal to the total buy price"
//       ),
//       "Expected an error but did not get one"
//     );
//   });

//   it("should calculate buy price during auction", async () => {
//     let adminContract = await makeAdminContract();

//     let buyPrice = await adminContract._calculateTotalBuyPrice(
//       10000,
//       100,
//       312400
//     );
//     assert.equal(
//       buyPrice.toString(),
//       new BN(50).toString(),
//       "Buy price is not correct"
//     );
//   });

//   it("should calculate buy price after auction ends", async () => {
//     let adminContract = await makeAdminContract();

//     let buyPrice = await adminContract._calculateTotalBuyPrice(
//       10000,
//       100,
//       700000
//     );
//     assert.equal(
//       buyPrice.toString(),
//       new BN(0).toString(),
//       "Buy price is not correct"
//     );
//   });
// });
