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

![](./docs/architecture.png)

![](./docs/actions.png)
