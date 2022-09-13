import { Framework } from "@superfluid-finance/sdk-core";
import { BigNumber, ethers } from "ethers";
import { task } from "hardhat/config";

enum Action {
  CLAIM,
  BID,
}

task("example:bid")
  .addParam("superAppAddress", "AuctionSuperApp contract address")
  .addParam("licenseId", "License ID")
  .addParam("newForSalePrice", "New for sale price in ETH")
  .setAction(
    async (
      {
        superAppAddress,
        licenseId,
        newForSalePrice,
      }: {
        superAppAddress: string;
        licenseId: string;
        newForSalePrice: string;
      },
      hre
    ) => {
      const sf = await Framework.create({
        networkName: hre.network.name,
        provider: hre.ethers.provider,
      });
      const ethx = await sf.loadSuperToken("ETHx");
      const newForSalePriceWei = ethers.utils.parseEther(newForSalePrice);

      const [admin] = await hre.ethers.getSigners();

      const superApp = await hre.ethers.getContractAt(
        "AuctionSuperApp",
        superAppAddress
      );

      const perSecondFeeNumerator = await superApp.perSecondFeeNumerator();
      const perSecondFeeDenominator = await superApp.perSecondFeeDenominator();

      const newContributionRate = newForSalePriceWei
        .mul(perSecondFeeNumerator)
        .div(perSecondFeeDenominator);

      // Approve ETHx amount above purchase price
      const approveOp = ethx.approve({
        receiver: superApp.address,
        amount: newForSalePriceWei.toString(),
      });

      const bidData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [licenseId]
      );
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [newForSalePriceWei, bidData]
      );
      const userData = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [Action.BID, actionData]
      );

      const existingFlow = await sf.cfaV1.getFlow({
        sender: admin.address,
        receiver: superApp.address,
        superToken: ethx.address,
        providerOrSigner: admin,
      });

      let op;
      if (BigNumber.from(existingFlow.flowRate).gt(0)) {
        op = await sf.cfaV1.updateFlow({
          sender: admin.address,
          receiver: superApp.address,
          flowRate: BigNumber.from(existingFlow.flowRate)
            .add(newContributionRate)
            .toString(),
          superToken: ethx.address,
          userData: userData,
        });
      } else {
        op = await sf.cfaV1.createFlow({
          sender: admin.address,
          receiver: superApp.address,
          flowRate: newContributionRate.toString(),
          superToken: ethx.address,
          userData: userData,
        });
      }

      // Perform these in a single batch call
      const batchCall = sf.batchCall([approveOp, op]);
      const txn = await batchCall.exec(admin);
      await txn.wait();
    }
  );
