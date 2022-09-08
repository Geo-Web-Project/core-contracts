import { smock } from '@defi-wonderland/smock';
import { deployments, ethers } from 'hardhat';
import {
  PCOLicenseClaimerFacet,
  IDiamondLoupe,
  PCOLicenseParamsFacet,
} from '../../typechain-types';
import { perYearToPerSecondRate, setupSf } from '../shared';
import { addDays, getUnixTime, startOfToday } from 'date-fns';

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await setupSf();
    const { ethx_erc20, sf } = res;

    const { diamondAdmin } = await getNamedAccounts();
    const { diamond } = deployments;
    await diamond.deploy('PCOLicenseClaimer', {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: [
        'PCOLicenseClaimerFacet',
        'GeoWebParcelFacet',
        'PCOLicenseParamsFacet',
      ],
    });

    const pcoLicenseClaimer = await ethers.getContract(
      'PCOLicenseClaimer',
      diamondAdmin
    );

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    await (pcoLicenseClaimer as PCOLicenseParamsFacet).initializeParams(
      diamondAdmin,
      ethx_erc20.address,
      sf.host.address,
      numerator,
      denominator,
      numerator,
      denominator,
      60 * 60 * 24,
      60 * 60 * 24
    );

    return {
      pcoLicenseClaimer: pcoLicenseClaimer as PCOLicenseClaimerFacet,
      pcoLicenseParams: pcoLicenseClaimer as PCOLicenseParamsFacet,
      ...res,
    };
  }
);

const initialized = deployments.createFixture(async (hre, options) => {
  const res = await setup();
  const { pcoLicenseClaimer } = res;

  const mockFacet = await smock.fake('CFABasePCOFacet');
  const mockBeacon = await smock.fake<IDiamondLoupe>('IDiamondLoupe');

  mockBeacon.facetAddress.returns(mockFacet.address);

  await pcoLicenseClaimer.initializeClaimer(0, 0, 0, 0, mockBeacon.address);

  return res;
});

const initializedWithAuction = deployments.createFixture(
  async (hre, options) => {
    const res = await setup();
    const { pcoLicenseClaimer } = res;

    const mockFacet = await smock.fake('CFABasePCOFacet');
    const mockBeacon = await smock.fake<IDiamondLoupe>('IDiamondLoupe');

    mockBeacon.facetAddress.returns(mockFacet.address);

    const today = getUnixTime(startOfToday());
    const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

    const startBid = ethers.utils.parseEther('10');
    const endingBid = ethers.utils.parseEther('0');

    await pcoLicenseClaimer.initializeClaimer(
      today,
      tenDaysFromNow,
      startBid,
      endingBid,
      mockBeacon.address
    );

    return { ...res, today, tenDaysFromNow, startBid, endingBid };
  }
);

export default { setup, initialized, initializedWithAuction };
