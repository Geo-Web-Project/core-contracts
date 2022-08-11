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
  PCOLicenseParamsFacet,
} from "../../typechain-types";
import { perYearToPerSecondRate, errorHandler, setupSf } from "../shared";
import { getUpgradeableBeaconFactory } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { addDays, getUnixTime, startOfToday } from "date-fns";

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await setupSf();
    const { ethx_erc20, sf } = res;

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

    const pcoLicenseClaimer = await ethers.getContract(
      "PCOLicenseClaimer",
      diamondAdmin
    );

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    await (pcoLicenseClaimer as PCOLicenseParamsFacet).setPaymentToken(
      ethx_erc20.address
    );
    await (pcoLicenseClaimer as PCOLicenseParamsFacet).setBeneficiary(
      diamondAdmin
    );

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
      pcoLicenseClaimer: pcoLicenseClaimer as PCOLicenseClaimerFacet,
      pcoLicenseParams: pcoLicenseClaimer as PCOLicenseParamsFacet,
      mockParamsStore,
      ...res,
    };
  }
);

const initialized = deployments.createFixture(async (hre, options) => {
  const res = await setup();
  const { pcoLicenseClaimer } = res;

  const mockBeacon = await smock.fake("CFABasePCOFacet");

  const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
  const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

  await pcoLicenseClaimer.initializeClaimer(0, 0, 0, 0, beacon.address);

  return res;
});

const initializedWithAuction = deployments.createFixture(
  async (hre, options) => {
    const res = await setup();
    const { pcoLicenseClaimer, pcoLicenseParams } = res;

    const mockBeacon = await smock.fake("CFABasePCOFacet");

    const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre);
    const beacon = await UpgradeableBeaconFactory.deploy(mockBeacon.address);

    const today = getUnixTime(startOfToday());
    const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

    const startBid = ethers.utils.parseEther("10");
    const endingBid = ethers.utils.parseEther("0");

    await pcoLicenseClaimer.initializeClaimer(
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
