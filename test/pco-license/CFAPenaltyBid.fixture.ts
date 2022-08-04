import { BigNumber } from "ethers";
import { deployments } from "hardhat";
import { rateToPurchasePrice } from "../shared";
import BaseFixtures from "./CFABasePCO.fixture";

const afterPlaceBid = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    const res = await BaseFixtures.initialized();
    const { basePCOFacet, mockParamsStore, ethersjsSf, paymentToken } = res;

    const { bidder } = await getNamedAccounts();

    const newContributionRate = BigNumber.from(200);
    const newForSalePrice = await rateToPurchasePrice(
      mockParamsStore,
      newContributionRate
    );

    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(bidder))
      .getDepositRequiredForFlowRate(paymentToken.address, newContributionRate);
    const totalCollateral = newForSalePrice.add(requiredBuffer);

    // Approve payment token
    const approveOp = await paymentToken.approve({
      receiver: basePCOFacet.address,
      amount: totalCollateral.toString(),
    });
    await approveOp.exec(await ethers.getSigner(bidder));

    // Approve flow update
    const op = await ethersjsSf.cfaV1.updateFlowOperatorPermissions({
      superToken: paymentToken.address,
      flowOperator: basePCOFacet.address,
      permissions: 1,
      flowRateAllowance: newContributionRate.toString(),
    });
    await op.exec(await ethers.getSigner(bidder));

    const txn = await basePCOFacet
      .connect(await ethers.getSigner(bidder))
      .placeBid(newContributionRate, newForSalePrice);
    await txn.wait();

    return res;
  }
);

const afterAcceptBid = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
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

export default { afterPlaceBid, afterAcceptBid };
