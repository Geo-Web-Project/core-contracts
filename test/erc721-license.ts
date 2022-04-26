import { assert, use, expect } from "chai";
import { ethers } from "hardhat";
const BigNumber = ethers.BigNumber;
import { solidity } from "ethereum-waffle";
import { ERC721License__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

use(solidity);

describe("ERC721License", async () => {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;

  async function buildContract() {
    const factory = new ERC721License__factory(admin);
    const license = await factory.deploy();
    await license.deployed();

    return license;
  }

  before(async () => {
    accounts = await ethers.getSigners();

    [admin] = accounts;
  });

  it("should only allow MINT_ROLE to mint license", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);

    await expect(
      license.connect(accounts[2]).safeMint(accounts[2].address, 1)
    ).to.be.revertedWith("is missing role");

    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);
  });

  it("should only allow BURN_ROLE to burn license", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();
    let BURN_ROLE = await license.BURN_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.grantRole(BURN_ROLE, accounts[1].address);

    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await expect(license.connect(accounts[2]).burn(1)).to.be.revertedWith(
      "is missing role"
    );

    await license.connect(accounts[1]).burn(1);
  });

  it("should only allow admin to pause transfers", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();
    let OPERATOR_ROLE = await license.OPERATOR_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.grantRole(OPERATOR_ROLE, admin.address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await expect(license.connect(accounts[1]).pause()).to.be.revertedWith(
      "is missing role"
    );

    await license.pause();

    await expect(
      license
        .connect(admin)
        .transferFrom(accounts[2].address, accounts[1].address, 1)
    ).to.be.revertedWith("paused");

    await license.unpause();

    await license
      .connect(admin)
      .transferFrom(accounts[2].address, accounts[1].address, 1);
  });

  it("should not allow owner to transfer", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await expect(
      license
        .connect(accounts[2])
        .transferFrom(accounts[2].address, accounts[1].address, 1)
    ).to.be.revertedWith("Only OPERATOR_ROLE can transfer");
  });

  it("should allow OPERATOR_ROLE to transfer", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();
    let OPERATOR_ROLE = await license.OPERATOR_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.grantRole(OPERATOR_ROLE, accounts[3].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await license
      .connect(accounts[3])
      .transferFrom(accounts[2].address, accounts[1].address, 1);
  });

  it("should not allow approved address to transfer", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await license
      .connect(accounts[2])
      .setApprovalForAll(accounts[3].address, true);

    await expect(
      license
        .connect(accounts[3])
        .transferFrom(accounts[2].address, accounts[1].address, 1)
    ).to.be.revertedWith("Only OPERATOR_ROLE can transfer");
  });
});
