// const { assert } = require("chai");
// const { ethers, upgrades } = require("hardhat");

// const BigNumber = ethers.BigNumber;

// describe("ERC721License", async () => {
//   let accounts;

//   async function getContracts() {
//     const ERC721License = await ethers.getContractFactory("ERC721License");
//     const licenseContract = await upgrades.deployProxy(ERC721License, [
//       accounts[0].address,
//     ]);
//     await licenseContract.deployed();

//     return {
//       licenseContract: licenseContract,
//     };
//   }

//   before(async () => {
//     accounts = await ethers.getSigners();
//   });

//   it("should keep state on upgrade", async () => {
//     const ERC721License = await ethers.getContractFactory("ERC721License");
//     let license = await upgrades.deployProxy(ERC721License, [
//       accounts[0].address,
//     ]);
//     await license.deployed();

//     await license.mintLicense(accounts[1].address, BigNumber.from(2));

//     const license2 = await upgrades.upgradeProxy(
//       license.address,
//       ERC721License
//     );
//     await license2.deployed();
//   });

//   it("should only allow admin to mint", async () => {
//     const {
//       adminContract,
//       paymentTokenContract,
//       licenseContract,
//       parcelContract,
//     } = await getContracts();

//     var err;
//     try {
//       await licenseContract.mintLicense(
//         accounts[1].address,
//         BigNumber.from(1),
//         {
//           from: accounts[1].address,
//         }
//       );
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");

//     await licenseContract.mintLicense(accounts[1].address, BigNumber.from(1), {
//       from: accounts[0].address,
//     });
//   });

//   it("should allow owner to transfer", async () => {
//     const {
//       adminContract,
//       paymentTokenContract,
//       licenseContract,
//       parcelContract,
//     } = await getContracts();

//     await licenseContract.mintLicense(accounts[1].address, BigNumber.from(2));
//     await licenseContract
//       .connect(accounts[1])
//       .transferFrom(
//         accounts[1].address,
//         accounts[2].address,
//         BigNumber.from(2)
//       );
//   });

//   it("should allow admin to transfer", async () => {
//     const {
//       adminContract,
//       paymentTokenContract,
//       licenseContract,
//       parcelContract,
//     } = await getContracts();
//     await licenseContract.mintLicense(accounts[1].address, BigNumber.from(3));
//     await licenseContract.transferFrom(
//       accounts[1].address,
//       accounts[2].address,
//       BigNumber.from(3)
//     );
//   });

//   it("should not allow owner to approve another sender", async () => {
//     const {
//       adminContract,
//       paymentTokenContract,
//       licenseContract,
//       parcelContract,
//     } = await getContracts();

//     await licenseContract.mintLicense(accounts[1].address, BigNumber.from(4));
//     await licenseContract
//       .connect(accounts[1])
//       .approve(accounts[3].address, BigNumber.from(4));
//     await licenseContract
//       .connect(accounts[1])
//       .setApprovalForAll(accounts[3].address, true);

//     var err;
//     try {
//       await licenseContract
//         .connect(accounts[3])
//         .safeTransferFrom(
//           accounts[1].address,
//           accounts[2].address,
//           BigNumber.from(4)
//         );
//     } catch (error) {
//       err = error;
//     }

//     assert(err, "Expected an error but did not get one");
//   });
// });
