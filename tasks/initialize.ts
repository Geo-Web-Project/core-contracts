import { Contract } from "ethers";
import { SafeEthersSigner, SafeService } from "@gnosis.pm/safe-ethers-adapters";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import Safe from "@gnosis.pm/safe-core-sdk";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

const SAFE_SERVICES: Record<number, string> = {
  5: "https://safe-transaction.goerli.gnosis.io/",
};

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

export async function deploySuperfluid(hre: HardhatRuntimeEnvironment) {
  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  const { diamondAdmin } = await hre.getNamedAccounts();

  await deployFramework(errorHandler, {
    web3: hre.web3,
    from: diamondAdmin,
  });

  await deploySuperToken(errorHandler, [":", "ETH"], {
    web3: hre.web3,
    from: diamondAdmin,
  });

  const jsSf = new SuperfluidSDK.Framework({
    web3: hre.web3,
    version: "test",
    tokens: ["ETH"],
  });
  await jsSf.initialize();

  const sf = await Framework.create({
    chainId: hre.network.config.chainId!,
    provider: hre.web3,
    resolverAddress: (jsSf.resolver as Contract).address,
    protocolReleaseVersion: "test",
  });

  const ethx = await sf.loadSuperToken(jsSf.tokens.ETHx.address);

  return { sf, ethx };
}

async function deployBeneficiarySuperApp(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract
) {
  const { treasury, diamondAdmin } = await hre.getNamedAccounts();

  console.log();
  console.log("Deploying BeneficiarySuperApp");
  const factory = await hre.ethers.getContractFactory("BeneficiarySuperApp");
  const beneSuperApp = await hre.upgrades.deployProxy(factory, [
    registryDiamond.address,
    treasury,
  ]);
  await beneSuperApp.deployed();
  console.log("BeneficiarySuperApp deployed: ", beneSuperApp.address);

  // Set owner
  const txn = await beneSuperApp.transferOwnership(diamondAdmin);
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();

  return beneSuperApp;
}

async function initializeRegistryDiamond(
  hre: HardhatRuntimeEnvironment,
  sf: Framework,
  ethx: SuperToken,
  registryDiamondAddress: string,
  beaconDiamondAddress: string
) {
  const { diamondAdmin, deployer, treasury } = await hre.getNamedAccounts();

  // Initialize with Safe signer
  const service = new SafeService(
    SAFE_SERVICES[hre.network.config.chainId as number]
  );
  const ethAdapter = new EthersAdapter({
    ethers: hre.ethers as any,
    signer: (await hre.ethers.getSigner(deployer)) as any,
  });
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: diamondAdmin,
  });
  const safeSigner = new SafeEthersSigner(
    safe,
    service,
    hre.network.provider as any
  );
  const RegistryDiamond = await hre.ethers.getContractFactory(
    "RegistryDiamond"
  );
  const registryDiamond = RegistryDiamond.attach(
    registryDiamondAddress
  ).connect(safeSigner);
  const Ownable = await hre.ethers.getContractFactory("Ownable");
  const ownable = Ownable.attach(registryDiamondAddress).connect(safeSigner);

  const perSecondFee = perYearToPerSecondRate(0.1);

  let txn = await ownable.acceptOwnership();
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();
  txn = await registryDiamond.initializeERC721(
    "Geo Web Parcel License",
    "GEOL",
    ""
  );
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();
  txn = await registryDiamond.initializeClaimer(
    1665619570,
    1666224370,
    hre.ethers.utils.parseEther("1.0"),
    hre.ethers.utils.parseEther("0.005"),
    beaconDiamondAddress
  );
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();
  txn = await registryDiamond.initializeParams(
    treasury,
    ethx.address,
    sf.host.contract.address,
    perSecondFee.numerator,
    perSecondFee.denominator,
    1,
    10,
    60 * 60 * 24 * 7, // 7 days
    60 * 60 * 24 * 14, // 2 weeks,
    hre.ethers.utils.parseEther("0.005")
  );
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();
  console.log("Initialized RegistryDiamond.");

  const beneSuperApp = await deployBeneficiarySuperApp(hre, registryDiamond);
  console.log("Setting beneficiary to super app...");
  txn = await registryDiamond.setBeneficiary(beneSuperApp.address);
  console.log("Waiting to sign:", txn.hash);
  await txn.wait();
}

task("deploy:initialize")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addParam("beaconDiamondAddress", "BeaconDiamond address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        beaconDiamondAddress,
      }: {
        registryDiamondAddress: string;
        beaconDiamondAddress: string;
      },
      hre
    ) => {
      let sf: Framework;
      let ethx: SuperToken;
      if (hre.network.config.chainId == 31337) {
        const res = await deploySuperfluid(hre);
        sf = res.sf;
        ethx = res.ethx;
      } else {
        sf = await Framework.create({
          chainId: hre.network.config.chainId!,
          provider: hre.ethers.provider,
        });
        ethx = await sf.loadSuperToken("ETHx");
      }

      await initializeRegistryDiamond(
        hre,
        sf,
        ethx,
        registryDiamondAddress,
        beaconDiamondAddress
      );
    }
  );
