import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
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
    it("should calculate different address per user", async () => {
      const { pcoLicenseClaimer, mockParamsStore } =
        await Fixtures.initialized();
      const { user, bidder } = await getNamedAccounts();

      const nextAddress1 = await pcoLicenseClaimer.getNextProxyAddress(user);
      const nextAddress2 = await pcoLicenseClaimer.getNextProxyAddress(bidder);

      expect(nextAddress1).to.not.equal(nextAddress2);
    });

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

      await pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .claim(contributionRate, forSalePrice, coord, [BigNumber.from(0)]);

      const newBeaconProxy = await pcoLicenseClaimer.getBeaconProxy(0);

      expect(newBeaconProxy).to.equal(
        nextAddress,
        "First next address is not correct"
      );

      const nextAddress2 = await pcoLicenseClaimer.getNextProxyAddress(user);

      let coord1 = BigNumber.from(5).shl(32).or(BigNumber.from(33));
      await pcoLicenseClaimer
        .connect(await ethers.getSigner(user))
        .claim(contributionRate, forSalePrice, coord1, [BigNumber.from(0)]);

      const newBeaconProxy1 = await pcoLicenseClaimer.getBeaconProxy(1);
      expect(newBeaconProxy1).to.equal(
        nextAddress2,
        "Second next address is not correct"
      );
    });
  });
});
