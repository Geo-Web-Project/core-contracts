# Geo Web Project

Live at [http://cadastre.geoweb.eth.link/](http://cadastre.geoweb.eth.link/) or [ipns://cadastre.geoweb.eth](ipns://cadastre.geoweb.eth)

## Setup

Make sure to make a `.env` file in the root of your project based off the `.env.example` file.

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
