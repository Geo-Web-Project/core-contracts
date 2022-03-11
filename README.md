# Geo Web Project

[![Coverage Status](https://coveralls.io/repos/github/Geo-Web-Project/core-contracts/badge.svg?branch=main)](https://coveralls.io/github/Geo-Web-Project/core-contracts?branch=main)

Live at [http://cadastre.geoweb.eth.link/](http://cadastre.geoweb.eth.link/) or [ipns://cadastre.geoweb.eth](ipns://cadastre.geoweb.eth)

## Setup

Make sure to make a `.env` file in the root of your project based off the `.env.example` file.

## Tasks

### Deploy

```
npx hardhat deploy --network <NETWORK>
```

The `deploy` tasks will deploy all core contracts with default parameters and roles. Each contract has its own subtask that will be run.

## Architecture

![](https://mermaid.ink/img/pako:eNqlU8tqwzAQ_BWhUwtJoL0UdCi4iQsG54GdHAqGokibRiDLRo9DCPn3yq7S2HVDDrl4zexoZrSSjphVHDDBTFJjZoJ-aVoiVCjUAmhFNQOJjoUqLNo6IfnDI3rbJOnsM1umcQtzMFZXB9-Yxfk6W36EFjr9ysTZ9OX5KRUMlIGgZugO5kJZv26eLNYXva3TqnXJFhewps6AR1fRJo8vsFP_NTrOkWNWVCp3NeioroN3MpVUlKAbUlP7oIYu3M8uf-pdmd6p0Cl1iu3PjscbTuEY6ra0SJvQW0zTKJnfMSb__TuiyeR1GPEKrxfZc4Zba1irkPtK-7bIeFydZ0B61-8Kt6dIuvdrsIuGPhQhncHiEfZQSQX378SflH8e2O6hhAIT_8thR520BS7UyVNdzamFmAtbaUx2VBoYYepslR8Uw8RqB2dSeG6BdfoGN0Yzzw)

<details>
  <summary>Show source code</summary>

````
```mermaid
classDiagram
 class Parcel {
	 build() BUILD_ROLE
	 destroy() DESTROY_ROLE
 }
 class ERC721License {
	 safeMint() MINT_ROLE
	 burn() BURN_ROLE
	 pause() PAUSE_ROLE
	 unpause() PAUSE_ROLE
 }
 class AuctionSuperApp {
	 IClaimer claimer
	 IClaimer reclaimer
	 ERC721License license
	 pause() PAUSE_ROLE
	 unpause() PAUSE_ROLE
 }
 class FairLaunchClaimer {
	 ERC721License license
	 Parcel parcel
	 claim() CLAIM_ROLE
	 pause() PAUSE_ROLE
	 unpause() PAUSE_ROLE
 }

 AuctionSuperApp ..> FairLaunchClaimer
 AuctionSuperApp ..> ERC721License
 FairLaunchClaimer ..> Parcel
 FairLaunchClaimer ..> ERC721License
 FairLaunchClaimer --o Parcel : BUILD_ROLE
 FairLaunchClaimer --o ERC721License: MINT_ROLE
 AuctionSuperApp --o FairLaunchClaimer : CLAIM_ROLE
````
