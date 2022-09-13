import { web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
import { BigNumber } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { deployments, getUnnamedAccounts } from "hardhat";
import { ISuperfluid } from "../typechain-types";

export const errorHandler = (err: any) => {
  if (err) throw err;
};

export async function rateToPurchasePrice(paramsStore: any, rate: BigNumber) {
  const perSecondFeeNumerator = await paramsStore.getPerSecondFeeNumerator();
  const perSecondFeeDenominator =
    await paramsStore.getPerSecondFeeDenominator();

  return rate.mul(perSecondFeeDenominator).div(perSecondFeeNumerator);
}

export function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

export const setupSf = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture("setupSf");

    const accounts = await ethers.getSigners();

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

    return {
      paymentToken: ethx,
      ethx_erc20,
      ethersjsSf,
      sf,
      hostContract,
    };
  }
);
