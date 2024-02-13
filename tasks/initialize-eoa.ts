// import { Contract, BigNumber } from "ethers";
// import { task } from "hardhat/config";
// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import SuperfluidSDK from "@superfluid-finance/js-sdk";
// const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
// const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
// import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

// const NETWORKS: Record<number, string> = {
//   5: "goerli",
// };

// function perYearToPerSecondRate(annualRate: number) {
//   return {
//     numerator: annualRate * 100,
//     denominator: 60 * 60 * 24 * 365 * 100,
//   };
// }

// export async function deploySuperfluid(hre: HardhatRuntimeEnvironment) {
//   const errorHandler = (err: any) => {
//     if (err) throw err;
//   };

//   const { diamondAdmin } = await hre.getNamedAccounts();

//   await deployFramework(errorHandler, {
//     web3: hre.web3,
//     from: diamondAdmin,
//   });

//   await deploySuperToken(errorHandler, [":", "ETH"], {
//     web3: hre.web3,
//     from: diamondAdmin,
//   });

//   const jsSf = new SuperfluidSDK.Framework({
//     web3: hre.web3,
//     version: "test",
//     tokens: ["ETH"],
//   });
//   await jsSf.initialize();

//   const sf = await Framework.create({
//     chainId: hre.network.config.chainId!,
//     provider: hre.web3,
//     resolverAddress: (jsSf.resolver as Contract).address,
//     protocolReleaseVersion: "test",
//   });

//   const ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);

//   return { sf, ethx };
// }

// async function deployBeneficiarySuperApp(
//   hre: HardhatRuntimeEnvironment,
//   registryDiamond: Contract
// ) {
//   const { treasury, diamondAdmin, deployer } = await hre.getNamedAccounts();

//   console.log();
//   console.log("Deploying BeneficiarySuperApp");
//   const factory = await hre.ethers.getContractFactory("BeneficiarySuperApp");
//   const beneSuperApp = await hre.upgrades.deployProxy(
//     factory.connect(await hre.ethers.getSigner(deployer)),
//     [registryDiamond.address, treasury, ""]
//   );
//   await beneSuperApp.deployed();
//   console.log("BeneficiarySuperApp deployed: ", beneSuperApp.address);

//   // Set owner
//   await beneSuperApp.transferOwnership(diamondAdmin);
//   return beneSuperApp;
// }

// async function initializeRegistryDiamond(
//   hre: HardhatRuntimeEnvironment,
//   sfHost: string,
//   ethx: string,
//   registryDiamondAddress: string,
//   beaconDiamondAddress: string
// ) {
//   const { diamondAdmin, treasury } = await hre.getNamedAccounts();

//   const registryDiamond = await hre.ethers.getContractAt(
//     "IRegistryDiamond",
//     registryDiamondAddress
//   );

//   const perSecondFee = perYearToPerSecondRate(0.1);

//   let txn = await registryDiamond
//     .connect(await hre.ethers.getSigner(diamondAdmin))
//     .initializeERC721("Geo Web Parcel License", "GEOL", "");

//   txn.wait();

//   txn = await registryDiamond
//     .connect(await hre.ethers.getSigner(diamondAdmin))
//     .initializeClaimer(
//       "1670607584",
//       "1670780383",
//       hre.ethers.utils.parseEther("0.1").toString(),
//       hre.ethers.utils.parseEther("0.005").toString(),
//       beaconDiamondAddress
//     );

//   await txn.wait();

//   txn = await registryDiamond
//     .connect(await hre.ethers.getSigner(diamondAdmin))
//     .initializeParams(
//       treasury,
//       ethx,
//       sfHost,
//       perSecondFee.numerator.toString(),
//       perSecondFee.denominator.toString(),
//       "1",
//       "10",
//       BigNumber.from(60 * 60 * 24 * 7).toString(), // 7 days
//       BigNumber.from(60 * 60 * 24 * 14).toString(), // 2 weeks,
//       hre.ethers.utils.parseEther("0.005").toString()
//     );

//   await txn.wait();

//   console.log("Initialized RegistryDiamond.");
// }

// task("deploy:eoa:initialize")
//   .addParam("registryDiamondAddress", "RegistryDiamond address")
//   .addParam("pcoLicenseDiamondAddress", "PCOLicenseDiamond address")
//   .setAction(
//     async (
//       {
//         registryDiamondAddress,
//         pcoLicenseDiamondAddress,
//       }: {
//         registryDiamondAddress: string;
//         pcoLicenseDiamondAddress: string;
//       },
//       hre
//     ) => {
//       const network = await hre.ethers.provider.getNetwork();
//       let sfHost: string;
//       let ethx: string;
//       if (network.chainId == 31337) {
//         const res = await deploySuperfluid(hre);
//         sfHost = res.sf.host.contract.address;
//         ethx = res.ethx.address;
//       } else {
//         sfHost = "0xd399e2Fb5f4cf3722a11F65b88FAB6B2B8621005";
//         ethx = "0x0043d7c85C8b96a49A72A92C0B48CdC4720437d7";
//       }

//       await initializeRegistryDiamond(
//         hre,
//         sfHost,
//         ethx,
//         registryDiamondAddress,
//         pcoLicenseDiamondAddress
//       );
//     }
//   );

// task("deploy:eoa:beneficiarySuperApp")
//   .addParam("registryDiamondAddress", "RegistryDiamond address")
//   .setAction(
//     async (
//       {
//         registryDiamondAddress,
//       }: {
//         registryDiamondAddress: string;
//       },
//       hre
//     ) => {
//       const { diamondAdmin } = await hre.getNamedAccounts();

//       const registryDiamond = await hre.ethers.getContractAt(
//         "IRegistryDiamond",
//         registryDiamondAddress
//       );
//       const beneSuperApp = await deployBeneficiarySuperApp(
//         hre,
//         registryDiamond
//       );
//       console.log("Setting beneficiary to super app...");

//       await registryDiamond
//         .connect(await hre.ethers.getSigner(diamondAdmin))
//         .setBeneficiary(beneSuperApp.address);
//     }
//   );

// task("deploy:eoa:transferOwnership")
//   .addParam("registryDiamondAddress", "RegistryDiamond address")
//   .addParam("pcoLicenseDiamondAddress", "PCOLicenseDiamond address")
//   .setAction(
//     async (
//       {
//         registryDiamondAddress,
//         pcoLicenseDiamondAddress,
//       }: {
//         registryDiamondAddress: string;
//         pcoLicenseDiamondAddress: string;
//       },
//       hre
//     ) => {
//       const { diamondAdmin, deployer } = await hre.getNamedAccounts();

//       const registryDiamond = await hre.ethers.getContractAt(
//         "SafeOwnable",
//         registryDiamondAddress,
//         await hre.ethers.getSigner(deployer)
//       );
//       const beaconDiamond = await hre.ethers.getContractAt(
//         "SafeOwnable",
//         pcoLicenseDiamondAddress,
//         await hre.ethers.getSigner(deployer)
//       );

//       await registryDiamond.transferOwnership(diamondAdmin);
//       await beaconDiamond.transferOwnership(diamondAdmin);

//       await registryDiamond
//         .connect(await hre.ethers.getSigner(diamondAdmin))
//         .acceptOwnership();

//       await beaconDiamond
//         .connect(await hre.ethers.getSigner(diamondAdmin))
//         .acceptOwnership();
//     }
//   );
