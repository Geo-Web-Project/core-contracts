import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { addDays, endOfToday, getUnixTime, startOfToday } from 'date-fns';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';
import * as hre from 'hardhat';

import {
  AuctionSuperApp,
  ERC721License,
  FairLaunchClaimer,
  FairLaunchClaimer__factory,
  GeoWebParcel,
} from '../typechain-types';

const ethers = hre.ethers;

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe('FairLaunchClaimer', async function () {
  let accounts: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user: SignerWithAddress;
  let claimer: Contract;
  let fakeParcel: FakeContract<GeoWebParcel>
  let fakeLicense: FakeContract<ERC721License>
  let userArg: string;
  let initialContributionRate: BigNumber
  let claimData: any;
  let licenseId: number;

  async function buildContract(): Promise<FairLaunchClaimer> {
    const factory = new FairLaunchClaimer__factory(admin);
    const claimerContract: FairLaunchClaimer = await factory.deploy();
    await claimerContract.deployed();

    return claimerContract;
  }


  async function setupAuction() {
    claimer = await buildContract();

    fakeParcel = await smock.fake('GeoWebParcel');
    fakeLicense = await smock.fake('ERC721License');

    const today = getUnixTime(startOfToday());
    const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

    const startBid = ethers.utils.parseEther('10')
    const endingBid = ethers.utils.parseEther('0')

    await claimer.connect(admin).setAuctionStart(today)
    await claimer.connect(admin).setAuctionEnd(tenDaysFromNow)
    await claimer.connect(admin).setStartingBid(startBid)
    await claimer.connect(admin).setEndingBid(endingBid)

    await claimer.connect(admin).setParcel(fakeParcel.address)
    await claimer.connect(admin).setLicense(fakeLicense.address)
  }

  beforeEach(async() => {
    accounts = await ethers.getSigners();

    [admin, user] = accounts;
  })

  describe('#claim', async() => {
    beforeEach(async() =>  {
      console.log('claim')
      await setupAuction();

      claimData = ethers.utils.defaultAbiCoder.encode(
        ["uint64", "uint256[]"],
        [BigNumber.from(1), [BigNumber.from(1)]]
      );

      userArg = await user.getAddress();
      initialContributionRate = BigNumber.from(9);
    })

    it('requires the CLAIMER role', async() => {
      await expect(claimer.connect(user)
        .claim(userArg, initialContributionRate, claimData))
        .to.be.rejectedWith(/AccessControl/)

      const CLAIM_ROLE = await claimer.CLAIM_ROLE();
      await claimer.connect(admin).grantRole(CLAIM_ROLE, await user.getAddress());
      await expect(claimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.fulfilled;
    })

    describe('success', async() => {
      beforeEach(async () => {
        const CLAIM_ROLE = await claimer.CLAIM_ROLE();
        await claimer.connect(admin).grantRole(CLAIM_ROLE, await user.getAddress());

        licenseId = BigNumber.from(1).toNumber();
        fakeParcel.build.returns(licenseId);
      })

      it('returns the licenseId', async () => {
        const tx = await claimer.connect(user).claim(userArg, initialContributionRate, claimData)
        const receipt = await tx.wait();
        const retVal = receipt.events![0].topics[1];
        expect(Number(retVal)).to.be.equal(licenseId);
      })

      it('calls license.safeMint', async () => {
        await claimer.connect(user).claim(userArg, initialContributionRate, claimData)
        expect(fakeLicense.safeMint).to.have.been.calledWith(userArg, licenseId);
      })

      it('user must claim when auction has started', async() => {
        await claimer.connect(admin).setAuctionStart(getUnixTime(endOfToday()))
        await claimer.connect(admin).setAuctionEnd(getUnixTime(addDays(startOfToday(), 2)))
        await expect(claimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.rejectedWith(/auction has not started yet/)

        await claimer.connect(admin).setAuctionStart(getUnixTime(startOfToday()))
        await expect(claimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.fulfilled
      })

      it('user must claim when auction has started', async() => {
        await claimer.connect(admin).setAuctionStart(getUnixTime(startOfToday()))
        await claimer.connect(admin).setAuctionEnd(getUnixTime(startOfToday()))
        await expect(claimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.rejectedWith(/geneisis is complete/)

        await claimer.connect(admin).setAuctionEnd(getUnixTime(addDays(startOfToday(), 2)))
        await expect(claimer.connect(user).claim(userArg, initialContributionRate, claimData)).to.be.fulfilled
      })
    })
  })

  describe('#claimPrice', async() => {
    let startBid: BigNumber;
    let endingBid: BigNumber;
    let prevPrice: BigNumber;
    let nextPrice; BigNumber;
    let today: number;
    let daysFromNow: number;

    const fakeAddress = "0x83df3eDa28Ec566740d47F44715C646304C9a113";

    beforeEach(async() => {
      claimer = await buildContract();

      today = getUnixTime(startOfToday());
      const tenDaysFromNow = getUnixTime(addDays(startOfToday(), 10));

      startBid = ethers.utils.parseEther('10')
      endingBid = ethers.utils.parseEther('0')

      await claimer.connect(admin).setAuctionStart(today)
      await claimer.connect(admin).setAuctionEnd(tenDaysFromNow)
      await claimer.connect(admin).setStartingBid(startBid)
      await claimer.connect(admin).setEndingBid(endingBid)

      const CLAIM_ROLE = await claimer.CLAIM_ROLE();
      await claimer.connect(admin).grantRole(CLAIM_ROLE, await user.getAddress());
    })

    it('should decay the price until the auction ends', async() => {
      const startPrice = await claimer.connect(user).claimPrice(await user.getAddress(), 20, fakeAddress)
      expect(startPrice.lt(startBid)).to.be.true
      // console.log(startPrice, startBid)

      daysFromNow = getUnixTime(addDays(startOfToday(), 2));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);

      prevPrice = await claimer.connect(user).claimPrice(await user.getAddress(), 20, fakeAddress)
      expect(prevPrice.lt(startPrice)).to.be.true
      // console.log(prevPrice, startPrice)

      daysFromNow = getUnixTime(addDays(startOfToday(), 5));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await claimer.connect(user).claimPrice(await user.getAddress(), 20, fakeAddress)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 7));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await claimer.connect(user).claimPrice(await user.getAddress(), 20, fakeAddress)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)

      prevPrice = nextPrice;
      daysFromNow = getUnixTime(addDays(startOfToday(), 10));
      await hre.network.provider.send("evm_mine", [ daysFromNow ]);
      nextPrice = await claimer.connect(user).claimPrice(await user.getAddress(), 20, fakeAddress)
      expect(nextPrice.lt(prevPrice)).to.be.true
      // console.log(nextPrice, prevPrice)
    })
  })

  describe('#pause()', async() => {
    it('should pause the contract', async () => {
      const claimer = await buildContract();
      expect(await claimer.paused()).to.equal(false)

      await claimer.connect(admin).pause();
      expect(await claimer.paused()).to.equal(true)
    })

    it('should only allow the PAUSE role to pause', async () => {
      const claimer = await buildContract();
      await expect(claimer.connect(user).pause()).to.be.rejectedWith(/AccessControl/)
    })
  })

  describe('#unpause()', async() => {
    beforeEach(async() =>  {
      claimer = await buildContract();
      await claimer.connect(admin).pause();
      expect(await claimer.paused()).to.equal(true)
    })

    it('should unpause the contract', async () => {
      expect(await claimer.paused()).to.equal(true)

      await claimer.connect(admin).unpause();
      expect(await claimer.paused()).to.equal(false)
    })

    it('should only allow the PAUSE role to pause', async () => {
      await expect(claimer.connect(user).unpause()).to.be.rejectedWith(/AccessControl/)
    })
  })

  describe('setters', async() => {
    beforeEach(async() => {
      claimer = await buildContract();
    })

    describe('#setParcel', () => {
      beforeEach(async() => {
        fakeParcel = await smock.fake('GeoWebParcel');
        await fakeParcel.deployed();
      })

      it('sets the Parcel', async() => {
        await claimer.connect(admin).setParcel(fakeParcel.address);
        expect(await claimer.parcel()).to.equal(fakeParcel.address);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(
          claimer.connect(user).setParcel(fakeParcel.address)
        ).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setSuperApp', async() => {
      let fakeAuctionApp: FakeContract<AuctionSuperApp>;

      beforeEach(async() => {
        fakeAuctionApp = await smock.fake('AuctionSuperApp');
        await fakeAuctionApp.deployed();
      })

      it('sets the auctionApp', async() => {
        await claimer.connect(admin).setSuperApp(fakeAuctionApp.address);
        expect(await claimer.auctionApp()).to.equal(fakeAuctionApp.address);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(
          claimer.connect(user).setSuperApp(fakeAuctionApp.address)
        ).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setLicense', async() => {
      beforeEach(async() => {
        fakeLicense = await smock.fake('ERC721License');
        await fakeLicense.deployed();
      })

      it('sets the License', async() => {
        await claimer.connect(admin).setLicense(fakeLicense.address);
        expect(await claimer.license()).to.equal(fakeLicense.address);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(
          claimer.connect(user).setLicense(fakeLicense.address)
        ).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setStartingBid', async() => {
      it('sets the StartingBid', async() => {
        await claimer.connect(admin).setStartingBid(BigNumber.from(10));
        expect(await claimer.startingBid()).to.equal(BigNumber.from(10));
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(claimer.connect(user).setStartingBid(10)).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setEndingBid', async() => {
      it('sets the EndingBid', async() => {
        await claimer.connect(admin).setEndingBid(BigNumber.from(10));
        expect(await claimer.endingBid()).to.equal(BigNumber.from(10));
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(claimer.connect(user).setEndingBid(10)).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setAuctionStart', async() => {
      it('sets the AuctionStart', async() => {
        await claimer.connect(admin).setAuctionStart(1512918335);
        expect(await claimer.auctionStart()).to.equal(1512918335);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(claimer.connect(user).setAuctionStart(1512918335)).to.be.rejectedWith(/AccessControl/)
      })
    })

    describe('#setAuctionEnd', async() => {
      it('sets the AuctionEnd', async() => {
        await claimer.connect(admin).setAuctionStart(1512928335);
        expect(await claimer.auctionStart()).to.equal(1512928335);
      })

      it('rejects anyone with an ADMIN role', async() => {
        await expect(claimer.connect(user).setAuctionStart(1512928335)).to.be.rejectedWith(/AccessControl/)
      })
    })
  })
})
