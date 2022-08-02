# Geo Web Project

[![Coverage Status](https://coveralls.io/repos/github/Geo-Web-Project/core-contracts/badge.svg?branch=main)](https://coveralls.io/github/Geo-Web-Project/core-contracts?branch=main)

Live at [http://geoweb.land/](http://geoweb.land/)

## Setup

Make sure to make a `.env` file in the root of your project based off the `.env.example` file.

## Tasks

### Deploy

```
npx hardhat deploy --network <NETWORK>
```

The `deploy` tasks will deploy all core contracts with default parameters and roles. Each contract has its own subtask that will be run.

## Architecture

![](https://mermaid.ink/img/pako:eNqlU1FrwjAQ_ishTxuosL0M8jDotINCtaXVh0FhnM05A21a0uRBxP--tIvTWsUHX3rlu---73KX7GlecaSM5gU0zUzAj4KSkEySDiAxqBwLss9kpsnaiII_PZOPVRDOvpMo9DuYY6NVtbOJmZ8uk-jLpcjhX8ZPpm-vL6HIUTbo1BrY4FxIbevmwWJ50lsbJTuXZHECazANWjT2Vql_go28ljhz9kyuRSVTU6Py6tp5B9MCRImqJbWxDyo8h_u9F3_xoZ4-QagQjMy3R8f9HSe3hroLHdJ1aC2moRfMHxiT_V6OaDJ5H7Z4g9dr2XKGR2tZsev7Rvq-yHhcHWfAetfvBrenyM7v1-AULX0ownqDvVrU3xYjUewn3jJKuho6olamBMHt27LbtU-K6i2WmFFmfzluwBQ6o5k8WKqpOWj0udCVomwDRYMjCkZX6U7mlGll8EhyT9SxDr8HSURz)

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
 AuctionSuperApp --o ERC721License : OPERATOR_ROLE
````
