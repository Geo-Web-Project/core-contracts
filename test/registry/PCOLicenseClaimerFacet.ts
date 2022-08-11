import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { getNamedAccounts } from "hardhat";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { BigNumber } from "ethers";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "./PCOLicenseClaimer.fixture";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("PCOLicenseClaimerFacet", async function () {
  describe("getNextAddress", async () => {
    it("should calculate next address", async () => {
      const { pcoLicenseClaimer, mockParamsStore } =
        await Fixtures.initialized();
      const { user } = await getNamedAccounts();

      const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

      let coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
      const contributionRate = BigNumber.from(100);
      const forSalePrice = await rateToPurchasePrice(
        mockParamsStore,
        contributionRate
      );

      await pcoLicenseClaimer.claim(contributionRate, forSalePrice, coord, [
        BigNumber.from(0),
      ]);

      const newBeaconProxy = await pcoLicenseClaimer.getBeaconProxy(0);

      expect(newBeaconProxy).to.equal(
        nextAddress,
        "Next address is not correct"
      );
    });
  });
});
