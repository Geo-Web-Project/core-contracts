const ERC721License = artifacts.require("ERC721License");
const BN = require("bn.js");
const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");
const GeoWebAdminERC20_v0 = artifacts.require("GeoWebAdminERC20_v0");
const GeoWebParcel = artifacts.require("GeoWebParcel");
const ERC20Mock = artifacts.require("ERC20Mock");

contract("ERC721License", async (accounts) => {
  async function getContracts() {
    const licenseContract = await ERC721License.new();
    licenseContract.initialize(accounts[0]);

    return {
      licenseContract: licenseContract,
    };
  }

  it("should keep state on upgrade", async () => {
    let license = await deployProxy(ERC721License, [accounts[0]], {
      unsafeAllowCustomTypes: true,
    });

    await license.mintLicense(accounts[1], new BN(2), "test-cid", {
      from: accounts[0],
    });

    let license2 = await upgradeProxy(license.address, ERC721License, {
      unsafeAllowCustomTypes: true,
    });

    const cid = await license2.rootContent(new BN(2));

    assert.equal(cid, "test-cid", "Root CID is incorrect");
  });

  it("should only allow admin to mint", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    var err;
    try {
      await licenseContract.mintLicense(accounts[1], new BN(1), "test-cid", {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.mintLicense(accounts[1], new BN(1), "test-cid", {
      from: accounts[0],
    });

    const cid = await licenseContract.rootContent(new BN(1));

    assert.equal(cid, "test-cid", "Root CID is incorrect");
  });

  it("should allow owner to transfer", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(accounts[1], new BN(2), "", {
      from: accounts[0],
    });
    await licenseContract.safeTransferFrom(
      accounts[1],
      accounts[2],
      new BN(2),
      {
        from: accounts[1],
      }
    );
  });

  it("should allow admin to transfer", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();
    await licenseContract.mintLicense(accounts[1], new BN(3), "", {
      from: accounts[0],
    });
    await licenseContract.safeTransferFrom(
      accounts[1],
      accounts[2],
      new BN(3),
      {
        from: accounts[0],
      }
    );
  });

  it("should not allow owner to approve another sender", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(accounts[1], new BN(4), "", {
      from: accounts[0],
    });
    await licenseContract.approve(accounts[3], new BN(4), {
      from: accounts[1],
    });
    await licenseContract.setApprovalForAll(accounts[3], true, {
      from: accounts[1],
    });

    var err;
    try {
      await licenseContract.safeTransferFrom(
        accounts[1],
        accounts[2],
        new BN(4),
        {
          from: accounts[3],
        }
      );
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });

  it("should only allow owner to set content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(accounts[1], new BN(2), "test-cid", {
      from: accounts[0],
    });

    var err;
    try {
      await licenseContract.setContent(new BN(2), "test-cid-1", {
        from: accounts[0],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.setContent(new BN(2), "test-cid-1", {
      from: accounts[1],
    });

    const cid = await licenseContract.rootContent(new BN(2));

    assert.equal(cid, "test-cid-1", "Root CID is incorrect");
  });

  it("should only allow owner to remove content", async () => {
    const {
      adminContract,
      paymentTokenContract,
      licenseContract,
      parcelContract,
    } = await getContracts();

    await licenseContract.mintLicense(accounts[1], new BN(2), "test-cid", {
      from: accounts[0],
    });

    await licenseContract.setContent(new BN(2), "test-cid-1", {
      from: accounts[1],
    });

    var err;
    try {
      await licenseContract.removeContent(new BN(2), {
        from: accounts[0],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await licenseContract.removeContent(new BN(2), {
      from: accounts[1],
    });

    const cid = await licenseContract.rootContent(new BN(2));

    assert.equal(cid, "", "Root CID is incorrect");
  });
});
