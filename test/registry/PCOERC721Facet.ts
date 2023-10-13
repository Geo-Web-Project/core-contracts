import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments, network } from "hardhat";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { BigNumber } from "ethers";
import { rateToPurchasePrice } from "../shared";
import Fixtures from "../pco-license/CFABasePCO.fixture";
import { addDays, getUnixTime, startOfToday } from "date-fns";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("PCOERC721Facet", async function () {
  describe("updateTokenURI", async () => {
    it("should update tokenURI if current owner", async () => {
      const { erc721License } = await Fixtures.initializedWithRealLicense();
      const { user } = await getNamedAccounts();

      const txn = await erc721License
        .connect(await ethers.getSigner(user))
        .updateTokenURI(0, "ipfs://test");

      await txn.wait();

      await expect(txn)
        .to.emit(erc721License, "TokenURIUpdated")
        .withArgs(0, "ipfs://test");
      expect(await erc721License.tokenURI(0)).to.equal("ipfs://test");
    });

    it("should fail to update tokenURI if not current owner", async () => {
      const { erc721License } = await Fixtures.initializedWithRealLicense();
      const { other } = await getNamedAccounts();

      const txn = erc721License
        .connect(await ethers.getSigner(other))
        .updateTokenURI(0, "ipfs://test");

      await expect(txn).to.be.revertedWith(
        "ERC721: caller is not owner or approved"
      );
    });
  });
});
