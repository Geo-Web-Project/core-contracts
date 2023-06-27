import { BigNumber } from "ethers";
import { deployments } from "hardhat";
import { rateToPurchasePrice, fromValueToRate } from "../shared";
import BaseFixtures from "./CFABasePCO.fixture";

const afterPlaceBid = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initialized();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newContributionRate = BigNumber.from(200000000);
    const newForSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      newContributionRate
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256)"](newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

const afterPlaceBidWithContentHash = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initializedWithContentHash();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newContributionRate = BigNumber.from(200000000);
    const newForSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      newContributionRate
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256,bytes)"](
        newContributionRate,
        newForSalePrice,
        "0x13"
      );
    await txn.wait();

    return res;
  }
);

const afterAcceptBid = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await afterPlaceBid();
    const { basePCOFacet } = res;
    const { user } = await getNamedAccounts();

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(user))
      .acceptBid();
    await txn.wait();

    return res;
  }
);

const afterPlaceBidAndSurplus = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await afterPlaceBid();
    const { basePCOFacet, ethersjsSf, ethx_erc20 } = res;
    const { user } = await getNamedAccounts();

    const existingContributionRate = await basePCOFacet.contributionRate();

    // User increases flow
    const op1 = ethersjsSf.cfaV1.updateFlow({
      receiver: basePCOFacet.address,
      flowRate: existingContributionRate.add(100),
      superToken: ethx_erc20.address,
    });

    const op1Resp = await op1.exec(await ethers.getSigner(user));
    const op1Receipt = await op1Resp.wait();
    const op1Block = await ethers.provider.getBlock(op1Receipt.blockNumber);

    return { ...res, surplusBlock: op1Block };
  }
);

const afterPlaceBidAndBidderRevokes = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await afterPlaceBid();
    const { basePCOFacet, ethersjsSf, paymentToken } = res;
    const { bidder } = await getNamedAccounts();

    // Revoke permissions
    const op = ethersjsSf.cfaV1.revokeFlowOperatorWithFullControl({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
    });
    await op.exec(await ethers.getSigner(bidder));

    return res;
  }
);

const afterPlaceBidWithRealLicense = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initializedWithRealLicense();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newContributionRate = ethers.utils
      .parseEther("9.1")
      .div(365 * 24 * 60 * 60 * 10);
    const newForSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      newContributionRate
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256)"](newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

const afterPlaceBidExtremeFeeDuring = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initializedExtremeFeeDuring();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newForSalePrice = BigNumber.from(50000);
    const newContributionRate = await fromValueToRate(
      mockParamsStore,
      newForSalePrice
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256)"](newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

const afterPlaceBidExtremeFeeAfter = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initializedExtremeFeeAfter();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newForSalePrice = BigNumber.from(50000);
    const newContributionRate = await fromValueToRate(
      mockParamsStore,
      newForSalePrice
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256)"](newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

const afterPlaceBidLargeExtremeFeeAfter = deployments.createFixture(
  async ({ getNamedAccounts, ethers }) => {
    const res = await BaseFixtures.initializedExtremeFeeAfter();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newForSalePrice = BigNumber.from(50000000);
    const newContributionRate = await fromValueToRate(
      mockParamsStore,
      newForSalePrice
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      ["placeBid(int96,uint256)"](newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

export default {
  afterPlaceBid,
  afterPlaceBidWithContentHash,
  afterAcceptBid,
  afterPlaceBidAndSurplus,
  afterPlaceBidAndBidderRevokes,
  afterPlaceBidWithRealLicense,
  afterPlaceBidExtremeFeeDuring,
  afterPlaceBidExtremeFeeAfter,
  afterPlaceBidLargeExtremeFeeAfter,
};
