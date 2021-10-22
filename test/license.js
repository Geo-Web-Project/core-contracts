const { assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = ethers.BigNumber;

describe("ERC721License", async () => {
  let accounts;

  async function buildContract() {
    const ERC721License = await ethers.getContractFactory("ERC721License");
    const license = await ERC721License.deploy();
    await license.deployed();

    return license;
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("should only allow role to mint license", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);

    var err;
    try {
      await license.connect(accounts[2]).safeMint(accounts[2].address, 1);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);
  });

  it("should only allow admin to pause transfers", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    var err;
    try {
      await license.connect(accounts[1]).pause();
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await license.pause();

    var err;
    try {
      await license
        .connect(accounts[2])
        .transferFrom(accounts[2].address, accounts[1].address, 1);
    } catch (error) {
      err = error;
    }

    assert(
      err.message.includes("paused"),
      "Expected an error but did not get one"
    );

    await license.unpause();

    await license
      .connect(accounts[2])
      .transferFrom(accounts[2].address, accounts[1].address, 1);
  });

  it("should allow owner to transfer", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    var err;
    try {
      await license
        .connect(accounts[1])
        .transferFrom(accounts[2].address, accounts[1].address, 1);
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await license
      .connect(accounts[2])
      .transferFrom(accounts[2].address, accounts[1].address, 1);
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

  it("should allow approved address to transfer", async () => {
    let license = await buildContract();
    let MINT_ROLE = await license.MINT_ROLE();

    await license.grantRole(MINT_ROLE, accounts[1].address);
    await license.connect(accounts[1]).safeMint(accounts[2].address, 1);

    await license
      .connect(accounts[2])
      .setApprovalForAll(accounts[3].address, true);

    await license
      .connect(accounts[3])
      .transferFrom(accounts[2].address, accounts[1].address, 1);
  });
});
