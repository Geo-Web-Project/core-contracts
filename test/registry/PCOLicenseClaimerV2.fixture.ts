import { smock } from "@defi-wonderland/smock";
import { deployments, ethers } from "hardhat";
import {
  IDiamondReadable,
  PCOLicenseParamsFacet,
  IPCOLicenseClaimerV1,
  IPCOLicenseClaimerV2,
  IPCOERC721,
} from "../../typechain-types";
import { perYearToPerSecondRate, setupSf } from "../shared";
import { addDays, getUnixTime, startOfToday } from "date-fns";
import { deployDiamond } from "../../scripts/deploy";

const setup = deployments.createFixture(async ({ getNamedAccounts }) => {
  const res = await setupSf();
  const { ethx_erc20, sf } = res;

  const { diamondAdmin } = await getNamedAccounts();
  const diamond = await deployDiamond("RegistryDiamond", {
    from: diamondAdmin,
    owner: diamondAdmin,
    facets: [
      "PCOLicenseClaimerFacetV2",
      "GeoWebParcelFacetV2",
      "PCOLicenseParamsFacet",
    ],
  });

  const pcoLicenseClaimerV1 = await ethers.getContractAt(
    `IPCOLicenseClaimerV1`,
    diamond.address
  );

  const pcoLicenseClaimerV2 = await ethers.getContractAt(
    `IPCOLicenseClaimerV2`,
    diamond.address
  );

  const { numerator, denominator } = perYearToPerSecondRate(0.1);

  await diamond.initializeParams(
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
    pcoLicenseClaimer: pcoLicenseClaimerV1 as IPCOLicenseClaimerV1,
    pcoLicenseClaimerV2: pcoLicenseClaimerV2 as IPCOLicenseClaimerV2,
    pcoLicenseParams: diamond as PCOLicenseParamsFacet,
    pcoERC721: diamond as IPCOERC721,
    ...res,
  };
});

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
