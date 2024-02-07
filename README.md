# Geo Web Project

[![Coverage Status](https://coveralls.io/repos/github/Geo-Web-Project/core-contracts/badge.svg?branch=main)](https://coveralls.io/github/Geo-Web-Project/core-contracts?branch=main)

Live at [http://geoweb.land/](http://geoweb.land/)

## Setup

Make sure to make a `.env` file in the root of your project based off the `.env.example` file.

## Deployments

### Optimism (Mainnet)

#### Proxies

| Contract                                                               | Address                                      | Etherscan                                                                           | Louper                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [RegistryDiamond](./contracts/registry)                                | `0xba1231785a7b4ac0e8dc9a0403938c2182ce4a4e` | https://optimistic.etherscan.io//address/0xba1231785a7b4ac0e8dc9a0403938c2182ce4a4e | https://louper.dev/diamond/0xba1231785a7b4ac0e8dc9a0403938c2182ce4a4e?network=optimism |
| [PCOLicenseDiamond](./contracts/pco-license)                           | `0xe5769B506e624044ac2d472e76BedBA53Dc2BbEd` | https://optimistic.etherscan.io/address/0xe5769B506e624044ac2d472e76BedBA53Dc2BbEd  | https://louper.dev/diamond/0xe5769B506e624044ac2d472e76BedBA53Dc2BbEd?network=optimism |
| [BeneficiarySuperApp](./contracts/beneficiary/BeneficiarySuperApp.sol) | `0x5aD276439E3772FDb6696B6cB61401902D4e8b72` | https://optimistic.etherscan.io/address/0x5aD276439E3772FDb6696B6cB61401902D4e8b72  |                                                                                        |

#### Facets

| Diamond                                      | Facet                                                                              | Address                                      | Etherscan                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| [RegistryDiamond](./contracts/registry)      | [GeoWebParcelFacetV2](./contracts/registry/facets/GeoWebParcelFacet.sol)           | `0x53E71045CB4611374e3B28C1A996d25A4397FE45` | https://optimistic.etherscan.io//address/0x53E71045CB4611374e3B28C1A996d25A4397FE45 |
| [RegistryDiamond](./contracts/registry)      | [PCOLicenseClaimerFacetV2](./contracts/registry/facets/PCOLicenseClaimerFacet.sol) | `0x455391cb23189F1Bfaae1Bf2de62718baf33d409` | https://optimistic.etherscan.io//address/0x455391cb23189F1Bfaae1Bf2de62718baf33d409 |
| [RegistryDiamond](./contracts/registry)      | [PCOLicenseParamsFacet](./contracts/registry/facets/PCOLicenseParamsFacet.sol)     | `0xCD3cAC9Dd1CE5f2E6cBff6De7a5f4cCB6f8207dd` | https://optimistic.etherscan.io//address/0xCD3cAC9Dd1CE5f2E6cBff6De7a5f4cCB6f8207dd |
| [RegistryDiamond](./contracts/registry)      | [PCOERC721Facet](./contracts/registry/facets/PCOERC721Facet.sol)                   | `0xe8F5c41Fc53ea331A68E45Cdb0ee2f8849EDcaA0` | https://optimistic.etherscan.io//address/0xe8F5c41Fc53ea331A68E45Cdb0ee2f8849EDcaA0 |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFABasePCOFacet](./contracts/pco-license/facets/CFABasePCOFacet.sol)              | `0x845B42DEaB9f007c5a7429606CD01596ead9f77B` | https://optimistic.etherscan.io//address/0x845B42DEaB9f007c5a7429606CD01596ead9f77B |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFAPenaltyBidFacet](./contracts/pco-license/facets/CFAPenaltyBidFacet.sol)        | `0x0E387d23cbCA12954971c44fb22C071dE382fBa6` | https://optimistic.etherscan.io//address/0x0E387d23cbCA12954971c44fb22C071dE382fBa6 |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFAReclaimerFacet](./contracts/pco-license/facets/CFAReclaimerFacet.sol)          | `0x88f2f48A949b21bddB00Fe735ebba79b42f8E261` | https://optimistic.etherscan.io//address/0x88f2f48A949b21bddB00Fe735ebba79b42f8E261 |

### Sepolia (Testnet)

#### Proxies

| Contract                                                               | Address                                      | Etherscan                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| [RegistryDiamond](./contracts/registry)                                | `0xaDD2eFb7f87Db4003c50d4aE60Bcc82b255F9222` | https://sepolia.etherscan.io/address/0xaDD2eFb7f87Db4003c50d4aE60Bcc82b255F9222 |
| [PCOLicenseDiamond](./contracts/pco-license)                           | `0xebe5138a89B27A95199B54130bC18234bcD0A1c1` | https://sepolia.etherscan.io/address/0xebe5138a89B27A95199B54130bC18234bcD0A1c1 |
| [BeneficiarySuperApp](./contracts/beneficiary/BeneficiarySuperApp.sol) | `0xeF94BAf7778a00a0f1fe3374AF715930ac15B5cA` | https://sepolia.etherscan.io/address/0xeF94BAf7778a00a0f1fe3374AF715930ac15B5cA |

#### Facets

| Diamond                                      | Facet                                                                              | Address                                      | Etherscan                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| [RegistryDiamond](./contracts/registry)      | [GeoWebParcelFacetV2](./contracts/registry/facets/GeoWebParcelFacet.sol)           | `0x204EFCebEc7F95f89019F64521ee1413B22E5Efe` | https://sepolia.etherscan.io/address/0x204EFCebEc7F95f89019F64521ee1413B22E5Efe |
| [RegistryDiamond](./contracts/registry)      | [PCOLicenseClaimerFacetV2](./contracts/registry/facets/PCOLicenseClaimerFacet.sol) | `0xCaEDD50B68eFF37A068D90113F5AC6110E3162e1` | https://sepolia.etherscan.io/address/0xCaEDD50B68eFF37A068D90113F5AC6110E3162e1 |
| [RegistryDiamond](./contracts/registry)      | [PCOLicenseParamsFacet](./contracts/registry/facets/PCOLicenseParamsFacet.sol)     | `0xbF67C77323ab9198ed3c5631Eb95086fb1F9585E` | https://sepolia.etherscan.io/address/0xbF67C77323ab9198ed3c5631Eb95086fb1F9585E |
| [RegistryDiamond](./contracts/registry)      | [PCOERC721Facet](./contracts/registry/facets/PCOERC721Facet.sol)                   | `0x96e55975fE494B2fa35e45D864f22224cb8DEA37` | https://sepolia.etherscan.io/address/0x96e55975fE494B2fa35e45D864f22224cb8DEA37 |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFABasePCOFacet](./contracts/pco-license/facets/CFABasePCOFacet.sol)              | `0x083B29783A15c1207428D9A382Eaa7557D0E6A82` | https://sepolia.etherscan.io/address/0x083B29783A15c1207428D9A382Eaa7557D0E6A82 |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFAPenaltyBidFacet](./contracts/pco-license/facets/CFAPenaltyBidFacet.sol)        | `0xAa23A59F83de01dD06D7E125cd2acB911147A06F` | https://sepolia.etherscan.io/address/0xAa23A59F83de01dD06D7E125cd2acB911147A06F |
| [PCOLicenseDiamond](./contracts/pco-license) | [CFAReclaimerFacet](./contracts/pco-license/facets/CFAReclaimerFacet.sol)          | `0xD865a309A3B3f646C21426DF127EBa272410D8b9` | https://sepolia.etherscan.io/address/0xD865a309A3B3f646C21426DF127EBa272410D8b9 |

## Architecture

![](./docs/architecture.png)

![](./docs/actions.png)
