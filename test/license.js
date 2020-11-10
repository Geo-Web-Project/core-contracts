const ERC721License = artifacts.require("ERC721License");
const BN = require("bn.js");

contract("ERC721License", async (accounts) => {
  it("should only allow minter to mint", async () => {
    let license = await ERC721License.new(accounts[0]);

    var err;
    try {
      await license.mintLicense(accounts[1], new BN(1), { from: accounts[1] });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await license.mintLicense(accounts[1], new BN(1), { from: accounts[0] });
  });

  it("should allow owner to transfer", async () => {
    let license = await ERC721License.new(accounts[0]);

    await license.mintLicense(accounts[1], new BN(2), { from: accounts[0] });
    await license.safeTransferFrom(accounts[1], accounts[2], new BN(2), {
      from: accounts[1],
    });
  });

  it("should allow admin to transfer", async () => {
    let license = await ERC721License.new(accounts[0]);

    await license.mintLicense(accounts[1], new BN(3), { from: accounts[0] });
    await license.safeTransferFrom(accounts[1], accounts[2], new BN(3), {
      from: accounts[0],
    });
  });

  it("should not allow owner to approve another sender", async () => {
    let license = await ERC721License.new(accounts[0]);

    await license.mintLicense(accounts[1], new BN(4), { from: accounts[0] });
    await license.approve(accounts[3], new BN(4), { from: accounts[1] });
    await license.setApprovalForAll(accounts[3], true, { from: accounts[1] });

    var err;
    try {
      await license.safeTransferFrom(accounts[1], accounts[2], new BN(4), {
        from: accounts[3],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");
  });
});
