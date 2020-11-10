const GeoWebAdmin = artifacts.require("GeoWebAdmin");
const ERC721License = artifacts.require("ERC721License");
const GeoWebParcel = artifacts.require("GeoWebParcel");

const BN = require("bn.js");

contract("GeoWebAdmin", async (accounts) => {
  it("should only allow owner to set license contract", async () => {
    let admin = await GeoWebAdmin.new();
    let license = await ERC721License.new(admin.address);

    var err;
    try {
      await admin.setLicenseContract(license.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await admin.setLicenseContract(license.address, {
      from: accounts[0],
    });
  });

  it("should only allow owner to set parcel contract", async () => {
    let admin = await GeoWebAdmin.new();
    let parcel = await GeoWebParcel.new(admin.address);

    var err;
    try {
      await admin.setParcelContract(parcel.address, {
        from: accounts[1],
      });
    } catch (error) {
      err = error;
    }

    assert(err, "Expected an error but did not get one");

    await admin.setParcelContract(parcel.address, {
      from: accounts[0],
    });
  });

  it("should claim land", async () => {
    let adminContract = await GeoWebAdmin.new();
    let licenseContract = await ERC721License.new(adminContract.address);
    let parcelContract = await GeoWebParcel.new(adminContract.address);

    await adminContract.setLicenseContract(licenseContract.address);
    await adminContract.setParcelContract(parcelContract.address);

    let coord = new BN(4).shln(32).or(new BN(33));
    let result = await adminContract.claim(accounts[1], coord, [new BN(0)], {
      from: accounts[1],
    });

    let parcelId = result.receipt.rawLogs[0].topics[1];
    let parcel = await parcelContract.getLandParcel(parcelId);

    assert(parcel != null, "Parcel was not minted");
    assert(
      (await licenseContract.ownerOf(parcelId)) == accounts[1],
      "License was not minted correctly"
    );
  });
});
