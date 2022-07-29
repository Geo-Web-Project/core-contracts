import { web3 } from "hardhat";
import { Framework } from "@superfluid-finance/sdk-core";
import { BigNumber } from "ethers";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
import { smock } from "@defi-wonderland/smock";
import { deployments } from "hardhat";
import { ISuperfluid } from "../../typechain-types/ISuperfluid";
import {
  perYearToPerSecondRate,
  errorHandler,
  rateToPurchasePrice,
} from "../shared";

const setup = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture();
    const { diamondAdmin } = await getNamedAccounts();
    const { diamond } = deployments;
    await diamond.deploy("TestBasePCO", {
      from: diamondAdmin,
      owner: diamondAdmin,
      facets: ["CFABasePCOFacet", "CFAPenaltyBidFacet"],
    });

    const { numerator, denominator } = perYearToPerSecondRate(0.1);

    const basePCOFacet = await ethers.getContract("TestBasePCO", diamondAdmin);

    const accounts = await ethers.getSigners();

    const [admin, user, bidder, other] = accounts;

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
      from: other.address,
      value: ethers.utils.parseEther("10"),
    });

    let mockParamsStore = await smock.fake("IPCOLicenseParamsStore");
    mockParamsStore.getPerSecondFeeNumerator.returns(numerator);
    mockParamsStore.getPerSecondFeeDenominator.returns(denominator);
    mockParamsStore.getHost.returns(sf.host.address);
    mockParamsStore.getPaymentToken.returns(sf.tokens.ETHx.address);
    mockParamsStore.getBeneficiary.returns(diamondAdmin);

    return {
      basePCOFacet,
      mockParamsStore,
      paymentToken: ethx,
      ethx_erc20,
      ethersjsSf,
      sf,
      hostContract,
    };
  }
);

const initialized = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await setup();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { user } = await getNamedAccounts();

    const contributionRate = BigNumber.from(100);
    const forSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      contributionRate
    );

    // Transfer payment token for buffer
    const op1 = await paymentToken.transfer({
      receiver: basePCOFacet.address,
      amount: forSalePrice.toString(),
    });
    await op1.exec(await ethers.getSigner(user));

    // Approve flow creation
    const op2 = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: contributionRate.toString(),
    });
    await op2.exec(await ethers.getSigner(user));

    const txn = await basePCOFacet.initializeBid(
      mockParamsStore.address,
      user,
      contributionRate,
      forSalePrice
    );
    await txn.wait();

    return res;
  }
);

export default { setup, initialized };
