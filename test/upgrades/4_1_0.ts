import { use, expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { upgrade } from "../../tasks/upgrades/4_1_0";
import Fixtures from "../registry/PCOLicenseClaimer.fixture";
import { rateToPurchasePrice } from "../shared";
import { ethers, getNamedAccounts, deployments } from "hardhat";

use(solidity);

describe("Migration v4.1.0", async () => {
  const setupTest = deployments.createFixture(async (hre) => {
    const { getNamedAccounts, ethers } = hre;
    const res = await Fixtures.initialized();
    const { pcoLicenseClaimer, pcoLicenseParams, ethersjsSf, paymentToken } =
      res;
    const { user } = await getNamedAccounts();

    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));
    const contributionRate = ethers.utils
      .parseEther("9")
      .div(365 * 24 * 60 * 60 * 10);
    const forSalePrice = await rateToPurchasePrice(
      pcoLicenseParams,
      contributionRate
    );

    // Approve payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const approveOp = paymentToken.approve({
      receiver: pcoLicenseClaimer.address,
      amount: requiredBuffer.toString(),
    });
    await approveOp.exec(await ethers.getSigner(user));

    const txn = await pcoLicenseClaimer
      .connect(await ethers.getSigner(user))
      .claim(contributionRate, forSalePrice, coord, [BigNumber.from(0)]);

    await txn.wait();

    // Migrate
    const diamond = await ethers.getContractAt(
      `IRegistryDiamond`,
      pcoLicenseClaimer.address
    );
    await upgrade(hre, diamond);

    const pcoLicenseClaimerV2 = await ethers.getContractAt(
      `IPCOLicenseClaimerV2`,
      diamond.address
    );

    const geoWebParcelV1 = await ethers.getContractAt(
      `IGeoWebParcelV1`,
      diamond.address
    );

    const geoWebParcelV2 = await ethers.getContractAt(
      `IGeoWebParcel`,
      diamond.address
    );

    return {
      ...res,
      diamond,
      pcoLicenseClaimerV2,
      geoWebParcelV1,
      geoWebParcelV2,
    };
  });

  it("should fail to claim V1", async () => {
    const { pcoLicenseClaimer, pcoLicenseParams, ethersjsSf, paymentToken } =
      await setupTest();
    const { user } = await getNamedAccounts();

    const coord = BigNumber.from(5).shl(32).or(BigNumber.from(33));
    const contributionRate = ethers.utils
      .parseEther("9")
      .div(365 * 24 * 60 * 60 * 10);
    const forSalePrice = await rateToPurchasePrice(
      pcoLicenseParams,
      contributionRate
    );

    // Approve payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const approveOp = paymentToken.approve({
      receiver: pcoLicenseClaimer.address,
      amount: requiredBuffer.toString(),
    });
    await approveOp.exec(await ethers.getSigner(user));

    const txn = pcoLicenseClaimer
      .connect(await ethers.getSigner(user))
      .claim(contributionRate, forSalePrice, coord, [BigNumber.from(0)]);

    await expect(txn).to.be.revertedWith(
      "DiamondBase: no facet found for function signature"
    );
  });

  it("should read old parcel after migration", async () => {
    const { geoWebParcelV1 } = await setupTest();

    const parcel = await geoWebParcelV1.getLandParcel(0);

    const coord = BigNumber.from(4).shl(32).or(BigNumber.from(33));

    expect(parcel.baseCoordinate).to.equal(coord);
  });

  it("should claim and read new parcel after migration", async () => {
    const {
      pcoLicenseClaimerV2,
      pcoLicenseClaimer,
      pcoLicenseParams,
      ethersjsSf,
      paymentToken,
      ethx_erc20,
      geoWebParcelV2,
    } = await setupTest();
    const { user } = await getNamedAccounts();

    const coord = BigNumber.from(5).shl(32).or(BigNumber.from(33));
    const contributionRate = ethers.utils
      .parseEther("9")
      .div(365 * 24 * 60 * 60 * 10);
    const forSalePrice = await rateToPurchasePrice(
      pcoLicenseParams,
      contributionRate
    );

    // Approve payment token for buffer
    const requiredBuffer = await ethersjsSf.cfaV1.contract
      .connect(await ethers.getSigner(user))
      .getDepositRequiredForFlowRate(paymentToken.address, contributionRate);
    const approveOp = paymentToken.approve({
      receiver: pcoLicenseClaimerV2.address,
      amount: requiredBuffer.toString(),
    });
    await approveOp.exec(await ethers.getSigner(user));

    const nextAddress = await pcoLicenseClaimer.getNextProxyAddress(user);

    const txn = await pcoLicenseClaimerV2
      .connect(await ethers.getSigner(user))
      ["claim(int96,uint256,(uint64,uint256,uint256))"](
        contributionRate,
        forSalePrice,
        [coord, 1, 1]
      );

    await txn.wait();

    await expect(txn)
      .to.emit(pcoLicenseClaimerV2, "ParcelClaimedV2")
      .withArgs(1, user);
    await expect(txn)
      .to.emit(ethx_erc20, "Transfer")
      .withArgs(user, nextAddress, requiredBuffer);

    const parcel = await geoWebParcelV2.getLandParcelV2(1);
    expect(parcel.swCoordinate).to.equal(coord);
  });
});
