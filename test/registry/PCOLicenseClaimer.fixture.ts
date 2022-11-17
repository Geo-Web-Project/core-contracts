import { smock } from "@defi-wonderland/smock";
import { deployments, ethers } from "hardhat";
import {
  IDiamondReadable,
  IPCOLicenseParamsStore,
} from "../../typechain-types";
import { perYearToPerSecondRate, setupSf } from "../shared";
import { addDays, getUnixTime, startOfToday } from "date-fns";
import { deployDiamond } from "../../scripts/deploy";

const setup = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await setupSf();
    const { ethx_erc20, sf } = res;

    const { diamondAdmin } = await getNamedAccounts();
    const diamond = await deployDiamond("RegistryDiamond", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: [
        "PCOLicenseClaimerFacetV1",
        "GeoWebParcelFacetV1",
        "PCOLicenseParamsFacet",
      ],
    });

    const pcoLicenseClaimer = await ethers.getContractAt(
      `IPCOLicenseClaimerV1`,
      diamond.address
    );

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    await (diamond as IPCOLicenseParamsStore).initializeParams(
      diamondAdmin,
      ethx_erc20.address,
      sf.host.address,
      numerator,
      denominator,
      numerator,
      denominator,
      60 * 60 * 24,
      60 * 60 * 24,
      0
    );

    return {
      pcoLicenseClaimer,
      pcoLicenseParams: diamond as IPCOLicenseParamsStore,
      ...res,
    };
  }
);

const initialized = deployments.createFixture(async () => {
  const res = await setup();
  const { pcoLicenseClaimer } = res;

  const mockFacet = await smock.fake("CFABasePCOFacet");
  const mockBeacon = await smock.fake<IDiamondReadable>("IDiamondReadable");

  mockBeacon.facetAddress.returns(mockFacet.address);

  await pcoLicenseClaimer.initializeClaimer(0, 0, 0, 0, mockBeacon.address);

  return res;
});

const initializedWithAuction = deployments.createFixture(async () => {
  const res = await setup();
  const { pcoLicenseClaimer } = res;

  const mockFacet = await smock.fake("CFABasePCOFacet");
  const mockBeacon = await smock.fake<IDiamondReadable>("IDiamondReadable");

  mockBeacon.facetAddress.returns(mockFacet.address);

  const today = getUnixTime(startOfToday());
  const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

  const startBid = ethers.utils.parseEther("10");
  const endingBid = ethers.utils.parseEther("0");

  await pcoLicenseClaimer.initializeClaimer(
    today,
    tenDaysFromNow,
    startBid,
    endingBid,
    mockBeacon.address
  );

  return { ...res, today, tenDaysFromNow, startBid, endingBid };
});

export default {
  setup,
  initialized,
  initializedWithAuction,
};
