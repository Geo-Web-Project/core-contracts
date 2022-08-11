import { web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { smock } from "@defi-wonderland/smock";
import { deployments, getUnnamedAccounts, ethers } from "hardhat";
import {
  PCOLicenseClaimerFacet,
  ISuperfluid,
  CFABasePCOFacet__factory,
} from "../../typechain-types";
import {
  perYearToPerSecondRate,
  errorHandler,
  rateToPurchasePrice,
} from "../shared";
import { getUpgradeableBeaconFactory } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { addDays, getUnixTime, startOfToday } from "date-fns";

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture();

    const { diamondAdmin } = await getNamedAccounts();
    const { diamond } = deployments;
    await diamond.deploy("PCOLicenseClaimer", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: [
        "PCOLicenseClaimerFacet",
        "GeoWebParcelFacet",
        "PCOLicenseParamsFacet",
      ],
    });

    const accounts = await ethers.getSigners();

    const pcoLicenseClaimer: PCOLicenseClaimerFacet = await ethers.getContract(
      "PCOLicenseClaimer",
      diamondAdmin
    );

    const [admin, user, bidder, other] = accounts;
    const uAccounts = await getUnnamedAccounts();

    await deployFramework(errorHandler, {
      web3,
      from: admin.address,
    });

    await deploySuperToken(errorHandler, [":", "ETH"], {
      web3,
      from: admin.address,
    });

    const sf = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: ["ETH"],
    });
    await sf.initialize();

    const ethersProvider = admin.provider!;
    const ethersjsSf: Framework = await Framework.create({
      chainId: 31337,
      resolverAddress: sf.resolver.address,
      protocolReleaseVersion: "test",
      provider: ethersProvider,
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    const ethx = await ethersjsSf.loadSuperToken(sf.tokens.ETHx.address);
    const ethx_erc20 = await ethers.getContractAt(
      "IERC20",
      sf.tokens.ETHx.address
    );
    const hostContract: ISuperfluid = await ethers.getContractAt(
      "ISuperfluid",
      sf.host.address
    );

    await sf.tokens.ETHx.upgradeByETH({
      from: user.address,
      value: ethers.utils.parseEther("10"),
    });

    await sf.tokens.ETHx.upgradeByETH({
      from: bidder.address,
      value: ethers.utils.parseEther("10"),
    });

    await sf.tokens.ETHx.upgradeByETH({
      from: uAccounts[3],
      value: ethers.utils.parseEther("10"),
    });

    let mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
    mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
    mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
    mockParamsStore.getPenaltyNumerator.returns(numerator);
    mockParamsStore.getPenaltyDenominator.returns(denominator);
    mockParamsStore.getHost.returns(sf.host.address);
    mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
    mockParamsStore.getBeneficiary.returns(diamondAdmin);
    mockParamsStore.getBidPeriodLengthInSeconds.returns(60 * 60 * 24);

    return {
      pcoLicenseClaimer,
      mockParamsStore,
      paymentToken: ethx,
      ethx_erc20,
      ethersjsSf,
      sf,
      hostContract,
    };
  }
);

const initialized = deployments.createFixture(async (hre, options) => {
  const res = await setup();
  const { pcoLicenseClaimer } = res;

  const mockBeacon = await smock.fake("CFABasePCOFacet");

  const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
  const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

  await pcoLicenseClaimer.initialize(0, 0, 0, 0, beacon.address);

  return res;
});

const initializedWithAuction = deployments.createFixture(
  async (hre, options) => {
    const res = await setup();
    const { pcoLicenseClaimer } = res;

    const mockBeacon = await smock.fake("CFABasePCOFacet");

    const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
    const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

    const today = getUnixTime(startOfToday());
    const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

    const startBid = ethers.utils.parseEther("10");
    const endingBid = ethers.utils.parseEther("0");

    await pcoLicenseClaimer.initialize(
      today,
      tenDaysFromNow,
      startBid,
      endingBid,
      beacon.address
    );

    return { ...res, today, tenDaysFromNow, startBid, endingBid };
  }
);

export default { setup, initialized, initializedWithAuction };
