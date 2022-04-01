import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { addDays, getUnixTime, startOfToday } from 'date-fns';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';
import * as hre from 'hardhat';

import { AuctionSuperApp, ERC721License, Reclaimer, Reclaimer__factory } from '../typechain-types';

const ethers = hre.ethers;
const network = hre.network;

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe('Reclaimer', async function () {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let reclaimer: Contract;
  let fakeLicense: FakeContract<ERC721License>
  let fakeSuperApp: FakeContract<AuctionSuperApp>
  let userArg: string;
  let initialContributionRate: BigNumber
  let claimData: any;
  let licenseId: number;

  const fakeAddress = "0x83df3eDa28Ec566740d47F44715C646304C9a113";

  async function buildContract(): Promise<Reclaimer> {
    const factory = new Reclaimer__factory(admin);
    const reclaimerContract: Reclaimer = await factory.deploy();
    await reclaimerContract.deployed();

    return reclaimerContract;
  }

  async function setupAuction() {
    reclaimer = await buildContract();

    fakeLicense = await smock.fake('ERC721License');
    fakeSuperApp = await smock.fake('AuctionSuperApp');

    const twoWeeks = 60 * 60 * 24 * 14;

    await reclaimer.connect(admin).setAuctionLength(twoWeeks)
    await reclaimer.connect(admin).setLicense(fakeLicense.address)
    await reclaimer.connect(admin).setSuperApp(fakeSuperApp.address)
  }

  // hacky solution to try to prevent side effects
  // from tweaked block times leaking into other tests
  //
  // resetting the netowrk after the file runs.
  before(async () => {
    await network.provider.send("hardhat_reset");
  });

  after(async () => {
    await network.provider.send("hardhat_reset");
  });

  beforeEach(async() => {
    accounts = await ethers.getSigners();

    [admin, user] = accounts;
  })

  describe('#claim', async() => {
    beforeEach(async() =>  {
      await setupAuction();

      // licenseId of 1
      claimData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);

      userArg = await user.getAddress();
      initialContributionRate = BigNumber.from(9);

      fakeLicense.ownerOf.returns(fakeAddress)
    })

    it('requires the CLAIMER role', async() => {
      await expect(reclaimer.connect(user)
        .claim(userArg, initialContributionRate, claimData))
        .to.be.rejectedWith(/AccessControl/)

      const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
      await reclaimer.connect(admin).grantRole(RECLAIM_ROLE, await user.getAddress());
      await expect(reclaimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.fulfilled;
      expect(fakeLicense['safeTransferFrom(address,address,uint256)']).to.have.been.calledWith(fakeAddress, userArg, 1);
    })

    it('reverts if user is the 0x0 address', async() => {
      const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
      await reclaimer.connect(admin).grantRole(RECLAIM_ROLE, await user.getAddress());
      fakeLicense.ownerOf.returns(ethers.constants.AddressZero);

      await expect(reclaimer.connect(user)
        .claim(userArg, initialContributionRate, claimData))
        .to.be.revertedWith("Reclaimer: Cannot reclaim non-existent license");
    })

    describe('success', async() => {
      beforeEach(async () => {
        const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
        await reclaimer.connect(admin).grantRole(RECLAIM_ROLE, await user.getAddress());
        licenseId = 1
      })

      it('emits the licenseId', async () => {
        const tx = await reclaimer.connect(user).claim(userArg, initialContributionRate, claimData)
        const receipt = await tx.wait();
        const retVal = receipt.events![0].topics[1];
        expect(Number(retVal)).to.be.equal(licenseId);
      })

      it('calls license.safeTransferFrom', async () => {
        await reclaimer.connect(user).claim(userArg, initialContributionRate, claimData)
        expect(fakeLicense['safeTransferFrom(address,address,uint256)']).to.have.been.calledWith(fakeAddress, userArg, licenseId);
      })
    })
  })

  describe('#claimPrice', async() => {
    let originalForSalePrice: BigNumber;
    let prevPrice: BigNumber;
    let nextPrice; BigNumber;
    let today: number;
    let daysFromNow: number;

    beforeEach(async() => {
      reclaimer = await buildContract();

      today = getUnixTime(startOfToday());
      const twoWeeks = 60 * 60 * 24 * 14;

      originalForSalePrice = ethers.utils.parseEther('5')

      await reclaimer.connect(admin).setAuctionLength(twoWeeks)
      const RECLAIM_ROLE = await reclaimer.RECLAIM_ROLE();
      await reclaimer.connect(admin).grantRole(RECLAIM_ROLE, await user.getAddress());

      claimData = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [originalForSalePrice, today]);
    })

    it('should decay the price until the auctionLength expires', async() => {
      const startPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(startPrice.lt(originalForSalePrice)).to.be.true
      // console.log(startPrice, originalForSalePrice)

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);

      prevPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(prevPrice.lt(startPrice)).to.be.true
      // console.log(prevPrice, startPrice)

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 13));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)
    })

    it('should return a price of 0 if auctionLength has expired', async() => {
      daysFromNow = getUnixTime(addDays(startOfToday(), 15));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      const price = await reclaimer.connect(user).claimPrice(await user.getAddress(), 0, claimData)
      // console.log(price)
      expect(price.eq(ethers.constants.Zero)).to.be.true
    })
  })

  describe('#pause()', async() => {
    it('should pause the contract', async () => {
      const reclaimer = await buildContract();
      expect(await reclaimer.paused()).to.equal(false)

      await reclaimer.connect(admin).pause();
      expect(await reclaimer.paused()).to.equal(true)
    })

    it('should only allow the PAUSE role to pause', async () => {
      const reclaimer = await buildContract();
      await expect(reclaimer.connect(user).pause()).to.be.rejectedWith(/AccessControl/)
    })
  })

  describe('#unpause()', async() => {
    beforeEach(async() =>  {
      reclaimer = await buildContract();
      await reclaimer.connect(admin).pause();
      expect(await reclaimer.paused()).to.equal(true)
    })

    it('should unpause the contract', async () => {
      expect(await reclaimer.paused()).to.equal(true)

      await reclaimer.connect(admin).unpause();
      expect(await reclaimer.paused()).to.equal(false)
    })

    it('should only allow the PAUSE role to pause', async () => {
      await expect(reclaimer.connect(user).unpause()).to.be.rejectedWith(/AccessControl/)
    })
  })

  describe('setters', async() => {
    beforeEach(async() => {
      reclaimer = await buildContract();
    })

    describe('#setLicense', async() => {
      beforeEach(async() => {
        fakeLicense = await smock.fake('ERC721License');
        await fakeLicense.deployed();
      })

      it('sets the License', async() => {
        await reclaimer.connect(admin).setLicense(fakeLicense.address);
        expect(await reclaimer.license()).to.equal(fakeLicense.address);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(
          reclaimer.connect(user).setLicense(fakeLicense.address)
        ).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setAuctionApp', async() => {
      beforeEach(async() => {
        fakeSuperApp = await smock.fake('AuctionSuperApp');
        await fakeSuperApp.deployed();
      })

      it('sets the auctionApp', async() => {
        await reclaimer.connect(admin).setSuperApp(fakeSuperApp.address);
        expect(await reclaimer.auctionApp()).to.equal(fakeSuperApp.address);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(
          reclaimer.connect(user).setLicense(fakeSuperApp.address)
        ).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setAuctionLength', async() => {
      it('sets the AuctionLength', async() => {
        await reclaimer.connect(admin).setAuctionLength(1512928335);
        expect(await reclaimer.auctionLength()).to.equal(1512928335);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(reclaimer.connect(user).setAuctionLength(1512928335)).to.be.rejectedWith(/AccessControl/)
      })
    })
  })
})
