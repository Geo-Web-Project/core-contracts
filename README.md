# Geo Web Project

Live at [http://cadastre.geoweb.eth.link/](http://cadastre.geoweb.eth.link/) or [ipns://cadastre.geoweb.eth](ipns://cadastre.geoweb.eth)

## Tasks

### Deploy

```
npx hardhat deploy --network <NETWORK>
```

The `deploy` tasks will deploy all core contracts with default parameters and roles. Each contract has its own subtask that will be run.

## Current Deployments

### Rinkeby

Commit:: 6e57060e9299911dc14cb4374890840ba50d5a1e

```
GeoWebCoordinate deployed to: 0x75CD1B88d09b2D8fCF46ec94dc028cF3DB04d96C
GeoWebCoordinatePath deployed to: 0xbdbd0Eb8190f1519c7213a0E61256476c01781C7
GeoWebParcel deployed to: 0x36Cf448d15Dbf4365c7421FA94dBEC93B95720E4
Accountant deployed to: 0x45fdCbcAaBE80b630d83a0f5a0Fb4a8b9cEFf84E
ERC721License deployed to: 0xF2282541d384D6d9A5C9B02D020fDFededd8D827
ETHPurchaser deployed to: 0xAEAd5f4FAb0cdA5f1E99a12830BF10fF8101c49C
ETHExpirationCollector deployed to: 0x8C6e0d49ca34fd262B209509F32aE4eC8D04F9eE
SimpleETHClaimer deployed to: 0x8a9c5ceeE10248e00F11c4F1da11349D6FAf6873
```

### zkSync Rinkeby

```
Running deploy script
GeoWebCoordinate deployed to: 0x8a9c5ceeE10248e00F11c4F1da11349D6FAf6873
GeoWebCoordinatePath deployed to: 0x603C2c5554f7c8AAF33679B4318cbD31861979fe
GeoWebParcel deployed to: 0x578182C07936c9acE19E4c740aA09fE1144C294B
Accountant deployed to: 0x203a674352CE3f846930bAFb35D9FaC0e37D8107
ERC721License deployed to: 0x00fF7FF89504267203a811C166b5b2CCb84fAf36
ETHPurchaser deployed to: 0xEeD666E77524899C26a72961A9E590123f17bc9D
ETHExpirationCollector deployed to: 0xD2b715895338978Af2580AE64c8C30e48275e559
SimpleETHClaimer deployed to: 0xff7805b39bd84E130A2bBc06f48f5eFBCD92297C

Setting default configuration...
Successfully set Accountant fee.
Successfully set Accountant validator.
Successfully set ETHExpirationCollector minContributionRate.
Successfully set ETHExpirationCollector minExpiration.
Successfully set ETHExpirationCollector maxExpiration.
Successfully set ETHExpirationCollector license.
Successfully set ETHExpirationCollector receiver.
Successfully set ETHExpirationCollector accountant.
Successfully set ETHPurchaser dutchAuctionLengthInSeconds.
Successfully set ETHPurchaser license.
Successfully set ETHPurchaser accountant.
Successfully set ETHPurchaser collector.
Successfully set SimpleETHClaimer claimer.
Successfully set SimpleETHClaimer license.
Successfully set SimpleETHClaimer parcel.
Successfully set SimpleETHClaimer collector.
Default configuration set.

Setting roles...
Successfully granted Accountant.MODIFY_CONTRIBUTION_ROLE to ETHExpirationCollector
Default roles set.
```
