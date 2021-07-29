const { assert } = require("chai");
const { ethers, upgrades } = require("hardhat");

const BigNumber = ethers.BigNumber;

describe("ERC721License", async () => {
  let accounts;

  async function getContracts() {
    const ERC721License = await ethers.getContractFactory("ERC721License");
    const licenseContract = await upgrades.deployProxy(ERC721License, [
      accounts[0].address,
    ]);
    await licenseContract.deployed();

    return {
      licenseContract: licenseContract,
    };
  }

  before(async () => {
    accounts = await ethers.getSigners();
  });

  //   it("should keep state on upgrade", async () => {
  //     let license = await deployProxy(ERC721License, [accounts[0].address], {
  //       unsafeAllowCustomTypes: true,
  //     });

  //     await license.mintLicense(accounts[1].address, BigNumber.from(2), "test-cid", {
  //       from: accounts[0].address,
  //     });

  //     let license2 = await upgradeProxy(license.address, ERC721License, {
  //       unsafeAllowCustomTypes: true,
  //     });

  //     const cid = await license2.rootContent(BigNumber.from(2));

  //     assert.equal(cid, "test-cid", "Root CID is incorrect");
  //   });

  it("should only allow admin to mint", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    var err;
    try {
      await licenseContract.mintLicense(
        accounts[1].address,
        BigNumber.from(1),
        "test-cid",
        {
          from: accounts[1].address,
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(1),
      "test-cid",
      {
        from: accounts[0].address,
      }
    );

    const cid = await licenseContract.rootContent(BigNumber.from(1));

    assert.equal(cid, "test-cid", "Root CID is incorrect");
  });

  it("should allow owner to transfer", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(2),
      ""
    );
    await licenseContract
      .connect(accounts[1])
      .safeTransferFrom(
        accounts[1].address,
        accounts[2].address,
        BigNumber.from(2)
      );
  });

  it("should allow admin to transfer", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();
    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(3),
      ""
    );
    await licenseContract.safeTransferFrom(
      accounts[1].address,
      accounts[2].address,
      BigNumber.from(3)
    );
  });

  it("should not allow owner to approve another sender", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(4),
      ""
    );
    await licenseContract
      .connect(accounts[1])
      .approve(accounts[3].address, BigNumber.from(4));
    await licenseContract
      .connect(accounts[1])
      .setApprovalForAll(accounts[3].address, true);

    var err;
    try {
      await licenseContract
        .connect(accounts[3])
        .safeTransferFrom(
          accounts[1].address,
          accounts[2].address,
          BigNumber.from(4)
        );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should allow owner to set content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(2),
      "test-cid"
    );

    var err;
    try {
      await licenseContract
        .connect(accounts[2])
        .setContent(BigNumber.from(2), "test-cid-1");
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract
      .connect(accounts[1])
      .setContent(BigNumber.from(2), "test-cid-1");

    const cid = await licenseContract.rootContent(BigNumber.from(2));

    assert.equal(cid, "test-cid-1", "Root CID is incorrect");
  });

  it("should allow admin to set content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(2),
      "test-cid"
    );

    var err;
    try {
      await licenseContract
        .connect(accounts[2])
        .setContent(BigNumber.from(2), "test-cid-1");
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.setContent(BigNumber.from(2), "test-cid-1");

    const cid = await licenseContract.rootContent(BigNumber.from(2));

    assert.equal(cid, "test-cid-1", "Root CID is incorrect");
  });

  it("should allow owner to remove content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(2),
      "test-cid"
    );

    await licenseContract
      .connect(accounts[1])
      .setContent(BigNumber.from(2), "test-cid-1");

    var err;
    try {
      await licenseContract
        .connect(accounts[2])
        .removeContent(BigNumber.from(2));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.connect(accounts[1]).removeContent(BigNumber.from(2));

    const cid = await licenseContract.rootContent(BigNumber.from(2));

    assert.equal(cid, "", "Root CID is incorrect");
  });

  it("should allow owner to remove content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(
      accounts[1].address,
      BigNumber.from(2),
      "test-cid"
    );

    await licenseContract
      .connect(accounts[1])
      .setContent(BigNumber.from(2), "test-cid-1");

    var err;
    try {
      await licenseContract
        .connect(accounts[2])
        .removeContent(BigNumber.from(2));
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.removeContent(BigNumber.from(2));

    const cid = await licenseContract.rootContent(BigNumber.from(2));

    assert.equal(cid, "", "Root CID is incorrect");
  });
});
