# Solidity API

## BeaconDiamond

### BeaconDiamond__NoFacetForSignature

```solidity
error BeaconDiamond__NoFacetForSignature()
```

### constructor

```solidity
constructor(address _contractOwner, contract IDiamondReadable _beacon) public payable
```

### _getImplementation

```solidity
function _getImplementation() internal view returns (address)
```

get logic implementation address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | implementation address |

## LibBeaconDiamond

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### DiamondStorage

```solidity
struct DiamondStorage {
  contract IDiamondReadable beacon;
}
```

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibBeaconDiamond.DiamondStorage ds)
```

### setBeacon

```solidity
function setBeacon(contract IDiamondReadable beacon) internal
```

## BeneficiarySuperApp

### cfaV1

```solidity
struct CFAv1Library.InitData cfaV1
```

### paramsStore

```solidity
contract IPCOLicenseParamsStore paramsStore
```

### lastDeletion

```solidity
mapping(address => uint256) lastDeletion
```

Timestamp of last deletion from each beacon proxy

### beneficiary

```solidity
address beneficiary
```

Beneficiary of funds.

### initialize

```solidity
function initialize(contract IPCOLicenseParamsStore paramsStore_, address beneficiary_) external
```

### getParamsStore

```solidity
function getParamsStore() external view returns (contract IPCOLicenseParamsStore)
```

Params Store

### setParamsStore

```solidity
function setParamsStore(contract IPCOLicenseParamsStore paramsStore_) external
```

Set Params Store

### getBeneficiary

```solidity
function getBeneficiary() external view returns (address)
```

Beneficiary

### setBeneficiary

```solidity
function setBeneficiary(address beneficiary_) external
```

Set Beneficiary

### getLastDeletion

```solidity
function getLastDeletion(address sender) external view returns (uint256)
```

Get last deletion for sender

### _setLastDeletion

```solidity
function _setLastDeletion(address beaconProxy) internal
```

Set last deletion of beacon proxy to now

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconProxy | address | Beacon proxy |

### afterAgreementTerminated

```solidity
function afterAgreementTerminated(contract ISuperToken superToken, address agreementClass, bytes32, bytes agreementData, bytes, bytes ctx) external returns (bytes newCtx)
```

### _isSameToken

```solidity
function _isSameToken(contract ISuperToken superToken) private view returns (bool)
```

### _isCFAv1

```solidity
function _isCFAv1(address agreementClass) private view returns (bool)
```

### onlyHost

```solidity
modifier onlyHost()
```

## MockParamsStore

### mockERC20

```solidity
contract ERC20Upgradeable mockERC20
```

### constructor

```solidity
constructor(contract ERC20Upgradeable mockERC20_) public
```

### getPaymentToken

```solidity
function getPaymentToken() external view returns (contract ISuperToken)
```

Payment token

### getHost

```solidity
function getHost() external pure returns (contract ISuperfluid)
```

Superfluid Host

### getBeneficiary

```solidity
function getBeneficiary() external pure returns (contract ICFABeneficiary)
```

Beneficiary

### getPerSecondFeeNumerator

```solidity
function getPerSecondFeeNumerator() external pure returns (uint256)
```

The numerator of the network-wide per second contribution fee.

### getPerSecondFeeDenominator

```solidity
function getPerSecondFeeDenominator() external pure returns (uint256)
```

The denominator of the network-wide per second contribution fee.

### getPenaltyNumerator

```solidity
function getPenaltyNumerator() external pure returns (uint256)
```

The numerator of the penalty rate.

### getPenaltyDenominator

```solidity
function getPenaltyDenominator() external pure returns (uint256)
```

The denominator of the penalty rate.

### getReclaimAuctionLength

```solidity
function getReclaimAuctionLength() external pure returns (uint256)
```

when the required bid amount reaches its minimum value.

### getBidPeriodLengthInSeconds

```solidity
function getBidPeriodLengthInSeconds() external pure returns (uint256)
```

Bid period length in seconds

### getMinForSalePrice

```solidity
function getMinForSalePrice() external pure returns (uint256)
```

Minimum for sale price

## FuzzyBeneficiarySuperApp

### mockParamsStore

```solidity
contract MockParamsStore mockParamsStore
```

### constructor

```solidity
constructor() public
```

### echidna_beneficiary_never_changes

```solidity
function echidna_beneficiary_never_changes() public view returns (bool)
```

### echidna_params_store_never_changes

```solidity
function echidna_params_store_never_changes() public view returns (bool)
```

### echidna_balance_never_decreases

```solidity
function echidna_balance_never_decreases() public view returns (bool)
```

## ICFABeneficiary

### getLastDeletion

```solidity
function getLastDeletion(address sender) external view returns (uint256)
```

Get last deletion for sender

## PCOLicenseDiamond

## CFABasePCOFacetModifiers

### onlyOwner

```solidity
modifier onlyOwner()
```

### onlyPayer

```solidity
modifier onlyPayer()
```

### onlyIfPayerBidActive

```solidity
modifier onlyIfPayerBidActive()
```

### onlyNotPayer

```solidity
modifier onlyNotPayer()
```

## CFABasePCOFacet

Handles basic PCO functionality using Constant Flow Agreement (CFA)

### PayerContributionRateUpdated

```solidity
event PayerContributionRateUpdated(address _payer, int96 contributionRate)
```

Emitted when an owner bid is updated

### initializeBid

```solidity
function initializeBid(contract ICFABeneficiary beneficiary, contract IPCOLicenseParamsStore paramsStore, contract IERC721 initLicense, uint256 initLicenseId, address bidder, int96 newContributionRate, uint256 newForSalePrice) external
```

Initialize bid.
     - Must be the contract owner
     - Must have payment token buffer deposited
     - Must have permissions to create flow for bidder

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary | contract ICFABeneficiary |  |
| paramsStore | contract IPCOLicenseParamsStore | Global store for parameters |
| initLicense | contract IERC721 | Underlying ERC721 license |
| initLicenseId | uint256 | Token ID of license |
| bidder | address | Initial bidder |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

### payer

```solidity
function payer() external view returns (address)
```

Current payer of license

### contributionRate

```solidity
function contributionRate() external view returns (int96)
```

Current contribution rate of payer

### forSalePrice

```solidity
function forSalePrice() external view returns (uint256)
```

Current price needed to purchase license

### licenseId

```solidity
function licenseId() external view returns (uint256)
```

License Id

### license

```solidity
function license() external view returns (contract IERC721)
```

License

### isPayerBidActive

```solidity
function isPayerBidActive() external view returns (bool)
```

Is current bid actively being paid

### currentBid

```solidity
function currentBid() external pure returns (struct LibCFABasePCO.Bid)
```

Get current bid

## TestableCFABasePCOFacet

### manualTransfer

```solidity
function manualTransfer(address to, uint256 amount) external
```

### manualCreateFlow

```solidity
function manualCreateFlow(address to, int96 flowRate) external
```

### manualDeleteFlow

```solidity
function manualDeleteFlow(address to) external
```

## CFAPenaltyBidFacet

Handles bidding using CFAs and penalities

### BidAccepted

```solidity
event BidAccepted(address _payer, address _bidder, uint256 forSalePrice)
```

Emitted when a bid is accepted

### BidRejected

```solidity
event BidRejected(address _payer, address _bidder, uint256 forSalePrice)
```

Emitted when a bid is rejected

### TransferTriggered

```solidity
event TransferTriggered(address _sender, address _payer, address _bidder, uint256 forSalePrice)
```

Emitted when a transfer is triggered

### onlyIfPendingBid

```solidity
modifier onlyIfPendingBid()
```

### onlyIfNotPendingBid

```solidity
modifier onlyIfNotPendingBid()
```

### onlyAfterBidPeriod

```solidity
modifier onlyAfterBidPeriod()
```

### onlyDuringBidPeriod

```solidity
modifier onlyDuringBidPeriod()
```

### shouldBidPeriodEndEarly

```solidity
function shouldBidPeriodEndEarly() public view returns (bool)
```

Should bid period end early

### pendingBid

```solidity
function pendingBid() external pure returns (struct LibCFAPenaltyBid.Bid)
```

Get pending bid

### hasPendingBid

```solidity
function hasPendingBid() external view returns (bool)
```

Checks if there is a pending bid

### calculatePenalty

```solidity
function calculatePenalty() external view returns (uint256)
```

Get penalty payment

### editBid

```solidity
function editBid(int96 newContributionRate, uint256 newForSalePrice) external
```

Edit bid
     - Must be the current payer
     - Must have permissions to update flow for payer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

### placeBid

```solidity
function placeBid(int96 newContributionRate, uint256 newForSalePrice) external
```

Place a bid to purchase license as msg.sender
     - Pending bid must not exist
     - Must have permissions to create flow for bidder
     - Must have ERC-20 approval of payment token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

### acceptBid

```solidity
function acceptBid() external
```

Accept a pending bid as the current payer
     - Must be payer
     - Pending bid must exist
     - Must be within bidding period

### rejectBid

```solidity
function rejectBid(int96 newContributionRate, uint256 newForSalePrice) external
```

Reject a pending bid as the current payer
     - Must be payer
     - Pending bid must exist
     - Must be within bidding period
     - Must approve penalty amount

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

### triggerTransfer

```solidity
function triggerTransfer() external
```

Trigger a transfer after bidding period has elapsed
     - Pending bid must exist
     - Must be after bidding period

## CFAReclaimerFacet

Handles reclaiming of licenses that are no longer active

### LicenseReclaimed

```solidity
event LicenseReclaimed(address to, uint256 price)
```

Emitted when a license is reclaimed

### reclaimPrice

```solidity
function reclaimPrice() public view returns (uint256)
```

Current price to reclaim

### reclaim

```solidity
function reclaim(uint256 maxClaimPrice, int96 newContributionRate, uint256 newForSalePrice) external
```

Reclaim an inactive license as msg.sender
     - Payer bid must be inactive
     - Must have permissions to create flow for bidder
     - Must have ERC-20 approval of payment token for claimPrice amount

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| maxClaimPrice | uint256 | Max price willing to pay for claim. Prevents front-running |
| newContributionRate | int96 | New contribution rate for license |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

## IBasePCO

### PayerForSalePriceUpdated

```solidity
event PayerForSalePriceUpdated(address _payer, uint256 forSalePrice)
```

Emitted when for sale price is updated

### payer

```solidity
function payer() external view returns (address)
```

Current payer of license

### forSalePrice

```solidity
function forSalePrice() external view returns (uint256)
```

Current for sale price of license

### licenseId

```solidity
function licenseId() external view returns (uint256)
```

License Id

### license

```solidity
function license() external view returns (contract IERC721)
```

License

## ICFABiddable

### BidPlaced

```solidity
event BidPlaced(address _bidder, int96 contributionRate, uint256 forSalePrice)
```

Emitted when for sale price is updated

### editBid

```solidity
function editBid(int96 newContributionRate, uint256 newForSalePrice) external
```

Edit bid

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

### placeBid

```solidity
function placeBid(int96 newContributionRate, uint256 newForSalePrice) external
```

Place a bid to purchase license as msg.sender

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newContributionRate | int96 | New contribution rate for bid |
| newForSalePrice | uint256 | Intented new for sale price. Must be within rounding bounds of newContributionRate |

## LibCFABasePCO

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### STORAGE_POSITION_CUR_BID

```solidity
bytes32 STORAGE_POSITION_CUR_BID
```

### STORAGE_POSITION_CFA

```solidity
bytes32 STORAGE_POSITION_CFA
```

### Bid

```solidity
struct Bid {
  uint256 timestamp;
  address bidder;
  int96 contributionRate;
  uint256 perSecondFeeNumerator;
  uint256 perSecondFeeDenominator;
  uint256 forSalePrice;
}
```

### DiamondStorage

```solidity
struct DiamondStorage {
  contract IPCOLicenseParamsStore paramsStore;
  contract IERC721 license;
  uint256 licenseId;
  contract ICFABeneficiary beneficiary;
}
```

### DiamondCFAStorage

```solidity
struct DiamondCFAStorage {
  struct CFAv1Library.InitData cfaV1;
}
```

### PayerContributionRateUpdated

```solidity
event PayerContributionRateUpdated(address _payer, int96 contributionRate)
```

Emitted when an owner bid is updated

### PayerForSalePriceUpdated

```solidity
event PayerForSalePriceUpdated(address _payer, uint256 forSalePrice)
```

Emitted when for sale price is updated

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibCFABasePCO.DiamondStorage ds)
```

### _currentBid

```solidity
function _currentBid() internal pure returns (struct LibCFABasePCO.Bid bid)
```

_Store currentBid in separate position so struct is upgradeable_

### cfaStorage

```solidity
function cfaStorage() internal pure returns (struct LibCFABasePCO.DiamondCFAStorage ds)
```

_Store cfa in separate position so struct is upgradeable_

### _getBeneficiary

```solidity
function _getBeneficiary() internal view returns (address)
```

_Get beneficiary or default if not set_

### _checkForSalePrice

```solidity
function _checkForSalePrice(uint256 forSalePrice, int96 contributionRate, uint256 _perSecondFeeNumerator, uint256 _perSecondFeeDenominator) internal pure returns (bool)
```

### _contributionRate

```solidity
function _contributionRate() internal view returns (int96)
```

### _isPayerBidActive

```solidity
function _isPayerBidActive() internal view returns (bool)
```

### _createBeneficiaryFlow

```solidity
function _createBeneficiaryFlow(int96 newContributionRate) internal
```

### _editBid

```solidity
function _editBid(int96 newContributionRate, uint256 newForSalePrice) internal
```

## LibCFAPenaltyBid

### STORAGE_POSITION_OUT_BID

```solidity
bytes32 STORAGE_POSITION_OUT_BID
```

### Bid

```solidity
struct Bid {
  uint256 timestamp;
  address bidder;
  int96 contributionRate;
  uint256 perSecondFeeNumerator;
  uint256 perSecondFeeDenominator;
  uint256 forSalePrice;
}
```

### pendingBid

```solidity
function pendingBid() internal pure returns (struct LibCFAPenaltyBid.Bid ds)
```

### FlowChangeType

```solidity
enum FlowChangeType {
  CREATE_FLOW,
  UPDATE_FLOW,
  DELETE_FLOW
}
```

### _getBooleanFlowOperatorPermissions

```solidity
function _getBooleanFlowOperatorPermissions(uint8 permissions, enum LibCFAPenaltyBid.FlowChangeType flowChangeType) internal pure returns (bool flowchangeTypeAllowed)
```

### _calculatePenalty

```solidity
function _calculatePenalty() internal view returns (uint256)
```

Calculate the penalty needed for the pending bid to be rejected

### _clearPendingBid

```solidity
function _clearPendingBid() internal
```

### _triggerTransfer

```solidity
function _triggerTransfer() internal
```

Trigger transfer of license

### _rejectBid

```solidity
function _rejectBid(int96 newContributionRate, uint256 newForSalePrice) internal
```

Reject Bid

## RegistryDiamond

## GeoWebParcelFacet

### availabilityIndex

```solidity
function availabilityIndex(uint256 x, uint256 y) external view returns (uint256)
```

Get availability index for coordinates

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | uint256 | X coordinate |
| y | uint256 | Y coordinate |

### getLandParcel

```solidity
function getLandParcel(uint256 id) external view returns (uint64 baseCoordinate, uint256[] path)
```

Get a land parcel

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | ID of land parcel |

## TestableGeoWebParcelFacet

### build

```solidity
function build(uint64 baseCoordinate, uint256[] path) external
```

### destroy

```solidity
function destroy(uint64 id) external
```

## FuzzyGeoWebParcelFacet

### constructor

```solidity
constructor() public
```

### build

```solidity
function build(uint64 baseCoordinate, uint256[] path) external
```

### echidna_coordinate_never_changes_parcel

```solidity
function echidna_coordinate_never_changes_parcel() public view returns (bool)
```

### echidna_coordinate_never_is_available

```solidity
function echidna_coordinate_never_is_available() public view returns (bool)
```

### echidna_next_id_never_repeats

```solidity
function echidna_next_id_never_repeats() public view returns (bool)
```

## GeoWebParcelFacetV2

### getLandParcelV2

```solidity
function getLandParcelV2(uint256 id) external view returns (uint64 swCoordinate, uint256 latDim, uint256 lngDim)
```

Get a V2 land parcel

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | ID of land parcel |

## TestableGeoWebParcelFacetV2

### build

```solidity
function build(struct LibGeoWebParcelV2.LandParcel parcel) external
```

## FuzzyGeoWebParcelFacetV2

### constructor

```solidity
constructor() public
```

### build

```solidity
function build(struct LibGeoWebParcelV2.LandParcel parcel) external
```

### echidna_coordinate_never_changes_parcel

```solidity
function echidna_coordinate_never_changes_parcel() public view returns (bool)
```

### echidna_coordinate_never_is_available

```solidity
function echidna_coordinate_never_is_available() public view returns (bool)
```

### echidna_next_id_never_repeats

```solidity
function echidna_next_id_never_repeats() public view returns (bool)
```

## PCOERC721Facet

### onlyOwner

```solidity
modifier onlyOwner()
```

### initializeERC721

```solidity
function initializeERC721(string name, string symbol, string baseURI) external
```

### _isApprovedOrOwner

```solidity
function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool)
```

_Override _isApprovedOrOwner to include corresponding beacon proxy_

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

ERC721 hook, called before all transfers including mint and burn

_function should be overridden and new implementation must call super_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | sender of token |
| to | address | receiver of token |
| tokenId | uint256 | id of transferred token |

## FuzzyPCOERC721Facet

### echidnaCaller

```solidity
address echidnaCaller
```

### constructor

```solidity
constructor() public
```

### echidna_operator_always_approved

```solidity
function echidna_operator_always_approved() public view returns (bool)
```

## IPCOLicenseClaimerFacet

### onlyOwner

```solidity
modifier onlyOwner()
```

### ParcelClaimed

```solidity
event ParcelClaimed(uint256 _licenseId, address _payer)
```

Emitted when a parcel is claimed

### initializeClaimer

```solidity
function initializeClaimer(uint256 auctionStart, uint256 auctionEnd, uint256 startingBid, uint256 endingBid, address beacon) external
```

Initialize.
     - Must be the contract owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| auctionStart | uint256 | start time of the genesis land parcel auction. |
| auctionEnd | uint256 | when the required bid amount reaches its minimum value. |
| startingBid | uint256 | start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd. |
| endingBid | uint256 | the final/minimum required bid reached and maintained at the end of the auction. |
| beacon | address | The beacon contract for PCO licenses |

### setStartingBid

```solidity
function setStartingBid(uint256 startingBid) external
```

Admin can update the starting bid.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startingBid | uint256 | The new starting bid |

### getStartingBid

```solidity
function getStartingBid() external view returns (uint256)
```

Starting bid

### setEndingBid

```solidity
function setEndingBid(uint256 endingBid) external
```

Admin can update the ending bid.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| endingBid | uint256 | The new ending bid |

### getEndingBid

```solidity
function getEndingBid() external view returns (uint256)
```

Ending bid

### setAuctionStart

```solidity
function setAuctionStart(uint256 auctionStart) external
```

Admin can update the start time of the initial Dutch auction.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| auctionStart | uint256 | The new start time of the initial Dutch auction |

### getAuctionStart

```solidity
function getAuctionStart() external view returns (uint256)
```

Auction start

### setAuctionEnd

```solidity
function setAuctionEnd(uint256 auctionEnd) external
```

Admin can update the end time of the initial Dutch auction.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| auctionEnd | uint256 | The new end time of the initial Dutch auction |

### getAuctionEnd

```solidity
function getAuctionEnd() external view returns (uint256)
```

Auction end

### setBeacon

```solidity
function setBeacon(address beacon) external
```

Admin can update the beacon contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beacon | address | The new beacon contract |

### getBeacon

```solidity
function getBeacon() external view returns (address)
```

Get Beacon

### requiredBid

```solidity
function requiredBid() external view returns (uint256)
```

The current dutch auction price of a parcel.

### getBeaconProxy

```solidity
function getBeaconProxy(uint256 licenseId) external view returns (address)
```

Get beacon proxy for license

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| licenseId | uint256 | License ID |

### getNextProxyAddress

```solidity
function getNextProxyAddress(address user) public view returns (address)
```

Get the next proxy address for user. To be used to grant permissions before calling claim

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |

### claim

```solidity
function claim(int96 initialContributionRate, uint256 initialForSalePrice, uint64 baseCoordinate, uint256[] path) external
```

Claim a new parcel and license
     - Must have ERC-20 approval of payment token
     - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initialContributionRate | int96 | Initial contribution rate of parcel |
| initialForSalePrice | uint256 | Initial for sale price of parcel |
| baseCoordinate | uint64 | Base coordinate of new parcel |
| path | uint256[] | Path of new parcel |

### _buildAndMint

```solidity
function _buildAndMint(address user, uint64 baseCoordinate, uint256[] path) internal virtual
```

Build a parcel and mint a license

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | Address of license owner to be |
| baseCoordinate | uint64 | Base coordinate of parcel to claim |
| path | uint256[] | Path of parcel to claim |

## PCOLicenseClaimerFacet

### _buildAndMint

```solidity
function _buildAndMint(address user, uint64 baseCoordinate, uint256[] path) internal
```

Build a parcel and mint a license

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | Address of license owner to be |
| baseCoordinate | uint64 | Base coordinate of parcel to claim |
| path | uint256[] | Path of parcel to claim |

## FuzzyPCOLicenseClaimerFacet

### constructor

```solidity
constructor() public
```

### echidna_params_never_change

```solidity
function echidna_params_never_change() public view returns (bool)
```

### echidna_no_repeat_next_address

```solidity
function echidna_no_repeat_next_address() public returns (bool)
```

## IPCOLicenseClaimerFacetV2

### ParcelClaimedV2

```solidity
event ParcelClaimedV2(uint256 _licenseId, address _payer)
```

Emitted when a parcel is claimed

### claim

```solidity
function claim(int96 initialContributionRate, uint256 initialForSalePrice, struct LibGeoWebParcelV2.LandParcel parcel) external
```

Claim a new parcel and license
     - Must have ERC-20 approval of payment token
     - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initialContributionRate | int96 | Initial contribution rate of parcel |
| initialForSalePrice | uint256 | Initial for sale price of parcel |
| parcel | struct LibGeoWebParcelV2.LandParcel | New parcel |

### _buildAndMint

```solidity
function _buildAndMint(address user, struct LibGeoWebParcelV2.LandParcel parcel) internal virtual
```

Build a parcel and mint a license

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | Address of license owner to be |
| parcel | struct LibGeoWebParcelV2.LandParcel | New parcel |

## PCOLicenseClaimerFacetV2

### _buildAndMint

```solidity
function _buildAndMint(address user, struct LibGeoWebParcelV2.LandParcel parcel) internal
```

Build a parcel and mint a license

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | Address of license owner to be |
| parcel | struct LibGeoWebParcelV2.LandParcel | New parcel |

## FuzzyPCOLicenseClaimerFacetV2

### constructor

```solidity
constructor() public
```

### echidna_params_never_change

```solidity
function echidna_params_never_change() public view returns (bool)
```

## PCOLicenseParamsFacet

### onlyOwner

```solidity
modifier onlyOwner()
```

### initializeParams

```solidity
function initializeParams(contract ICFABeneficiary beneficiary, contract ISuperToken paymentToken, contract ISuperfluid host, uint256 perSecondFeeNumerator, uint256 perSecondFeeDenominator, uint256 penaltyNumerator, uint256 penaltyDenominator, uint256 bidPeriodLengthInSeconds, uint256 reclaimAuctionLength, uint256 minForSalePrice) external
```

Initialize.
     - Must be the contract owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary | contract ICFABeneficiary | Beneficiary of funds. |
| paymentToken | contract ISuperToken | Payment token. |
| host | contract ISuperfluid | Superfluid host |
| perSecondFeeNumerator | uint256 | The numerator of the network-wide per second contribution fee. |
| perSecondFeeDenominator | uint256 | The denominator of the network-wide per second contribution fee. |
| penaltyNumerator | uint256 | The numerator of the penalty to pay to reject a bid. |
| penaltyDenominator | uint256 | The denominator of the penalty to pay to reject a bid. |
| bidPeriodLengthInSeconds | uint256 | Bid period length in seconds |
| reclaimAuctionLength | uint256 | when the required bid amount reaches its minimum value. |
| minForSalePrice | uint256 |  |

### getHost

```solidity
function getHost() external view returns (contract ISuperfluid)
```

Superfluid Host

### setHost

```solidity
function setHost(contract ISuperfluid host) external
```

Set Superfluid Host

### getPaymentToken

```solidity
function getPaymentToken() external view returns (contract ISuperToken)
```

Payment token

### setPaymentToken

```solidity
function setPaymentToken(contract ISuperToken paymentToken) external
```

Set Payment Token

### getBeneficiary

```solidity
function getBeneficiary() external view returns (contract ICFABeneficiary)
```

Beneficiary

### setBeneficiary

```solidity
function setBeneficiary(contract ICFABeneficiary beneficiary) external
```

Set Beneficiary

### getPerSecondFeeNumerator

```solidity
function getPerSecondFeeNumerator() external view returns (uint256)
```

The numerator of the network-wide per second contribution fee.

### setPerSecondFeeNumerator

```solidity
function setPerSecondFeeNumerator(uint256 perSecondFeeNumerator) external
```

Set Per Second Fee Numerator

### getPerSecondFeeDenominator

```solidity
function getPerSecondFeeDenominator() external view returns (uint256)
```

The denominator of the network-wide per second contribution fee.

### setPerSecondFeeDenominator

```solidity
function setPerSecondFeeDenominator(uint256 perSecondFeeDenominator) external
```

Set Per Second Fee Denominator

### getPenaltyNumerator

```solidity
function getPenaltyNumerator() external view returns (uint256)
```

The numerator of the penalty rate.

### setPenaltyNumerator

```solidity
function setPenaltyNumerator(uint256 penaltyNumerator) external
```

Set Penalty Numerator

### getPenaltyDenominator

```solidity
function getPenaltyDenominator() external view returns (uint256)
```

The denominator of the penalty rate.

### setPenaltyDenominator

```solidity
function setPenaltyDenominator(uint256 penaltyDenominator) external
```

Set Penalty Denominator

### getReclaimAuctionLength

```solidity
function getReclaimAuctionLength() external view returns (uint256)
```

the final/minimum required bid reached and maintained at the end of the auction.

### setReclaimAuctionLength

```solidity
function setReclaimAuctionLength(uint256 reclaimAuctionLength) external
```

Set Reclaim Auction Length

### getBidPeriodLengthInSeconds

```solidity
function getBidPeriodLengthInSeconds() external view returns (uint256)
```

Bid period length in seconds

### setBidPeriodLengthInSeconds

```solidity
function setBidPeriodLengthInSeconds(uint256 bidPeriodLengthInSeconds) external
```

Set Bid Period Length in seconds

### getMinForSalePrice

```solidity
function getMinForSalePrice() external view returns (uint256)
```

Minimum for sale price

### setMinForSalePrice

```solidity
function setMinForSalePrice(uint256 minForSalePrice) external
```

Set minimum for sale price

## FuzzyPCOLicenseParamsFacet

### constructor

```solidity
constructor() public
```

### echidna_params_never_change

```solidity
function echidna_params_never_change() public view returns (bool)
```

## IPCOLicenseParamsStore

### getHost

```solidity
function getHost() external view returns (contract ISuperfluid)
```

Superfluid Host

### getPaymentToken

```solidity
function getPaymentToken() external view returns (contract ISuperToken)
```

Payment token

### getBeneficiary

```solidity
function getBeneficiary() external view returns (contract ICFABeneficiary)
```

Beneficiary

### getPerSecondFeeNumerator

```solidity
function getPerSecondFeeNumerator() external view returns (uint256)
```

The numerator of the network-wide per second contribution fee.

### getPerSecondFeeDenominator

```solidity
function getPerSecondFeeDenominator() external view returns (uint256)
```

The denominator of the network-wide per second contribution fee.

### getPenaltyNumerator

```solidity
function getPenaltyNumerator() external view returns (uint256)
```

The numerator of the penalty rate.

### getPenaltyDenominator

```solidity
function getPenaltyDenominator() external view returns (uint256)
```

The denominator of the penalty rate.

### getReclaimAuctionLength

```solidity
function getReclaimAuctionLength() external view returns (uint256)
```

when the required bid amount reaches its minimum value.

### getBidPeriodLengthInSeconds

```solidity
function getBidPeriodLengthInSeconds() external view returns (uint256)
```

Bid period length in seconds

### getMinForSalePrice

```solidity
function getMinForSalePrice() external view returns (uint256)
```

Minimum for sale price

## LibGeoWebCoordinate

### MAX_X

```solidity
uint64 MAX_X
```

### MAX_Y

```solidity
uint64 MAX_Y
```

### traverse

```solidity
function traverse(uint64 origin, uint256 direction, uint256 iX, uint256 iY, uint256 i) external pure returns (uint64, uint256, uint256, uint256)
```

Traverse a single direction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | uint64 | The origin coordinate to start from |
| direction | uint256 | The direction to take |
| iX | uint256 |  |
| iY | uint256 |  |
| i | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64 | destination The destination coordinate |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### _traverse

```solidity
function _traverse(uint64 origin, uint256 direction, uint256 iX, uint256 iY, uint256 i) internal pure returns (uint64, uint256, uint256, uint256)
```

### _getX

```solidity
function _getX(uint64 coord) internal pure returns (uint64 coordX)
```

Get the X coordinate

### _getY

```solidity
function _getY(uint64 coord) internal pure returns (uint64 coordY)
```

Get the Y coordinate

### toWordIndex

```solidity
function toWordIndex(uint64 coord) external pure returns (uint256 iX, uint256 iY, uint256 i)
```

Convert coordinate to word index

### _toWordIndex

```solidity
function _toWordIndex(uint64 coord) internal pure returns (uint256 iX, uint256 iY, uint256 i)
```

## LibGeoWebCoordinatePath

LibGeoWebCoordinatePath stores a path of directions in a uint256. The most significant 8 bits encodes the length of the path

### INNER_PATH_MASK

```solidity
uint256 INNER_PATH_MASK
```

### PATH_SEGMENT_MASK

```solidity
uint256 PATH_SEGMENT_MASK
```

### nextDirection

```solidity
function nextDirection(uint256 path) external pure returns (bool hasNext, uint256 direction, uint256 nextPath)
```

Get next direction from path

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| path | uint256 | The path to get the direction from |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| hasNext | bool | If the path has a next direction |
| direction | uint256 | The next direction taken from path |
| nextPath | uint256 | The next path with the direction popped from it |

### _nextDirection

```solidity
function _nextDirection(uint256 path) internal pure returns (bool hasNext, uint256 direction, uint256 nextPath)
```

## LibGeoWebCoordinateV2

### MAX_X

```solidity
uint64 MAX_X
```

### MAX_Y

```solidity
uint64 MAX_Y
```

### traverse

```solidity
function traverse(uint64 origin, uint256 direction, uint256 iX, uint256 iY, uint256 i) external pure returns (uint64, uint256, uint256, uint256)
```

Traverse a single direction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | uint64 | The origin coordinate to start from |
| direction | uint256 | The direction to take |
| iX | uint256 |  |
| iY | uint256 |  |
| i | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64 | destination The destination coordinate |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### _traverse

```solidity
function _traverse(uint64 origin, uint256 direction, uint256 iX, uint256 iY, uint256 i) internal pure returns (uint64, uint256, uint256, uint256)
```

### _getX

```solidity
function _getX(uint64 coord) internal pure returns (uint64 coordX)
```

Get the X coordinate

### _getY

```solidity
function _getY(uint64 coord) internal pure returns (uint64 coordY)
```

Get the Y coordinate

### toWordIndex

```solidity
function toWordIndex(uint64 coord) external pure returns (uint256 iX, uint256 iY, uint256 i)
```

Convert coordinate to word index

### _toWordIndex

```solidity
function _toWordIndex(uint64 coord) internal pure returns (uint256 iX, uint256 iY, uint256 i)
```

## LibGeoWebParcel

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### LandParcel

```solidity
struct LandParcel {
  uint64 baseCoordinate;
  uint256[] path;
}
```

### Action

```solidity
enum Action {
  Build,
  Destroy,
  Check
}
```

### MAX_INT

```solidity
uint256 MAX_INT
```

_Maxmium uint256 stored as a constant to use for masking_

### ParcelBuilt

```solidity
event ParcelBuilt(uint256 _id)
```

Emitted when a parcel is built

### ParcelDestroyed

```solidity
event ParcelDestroyed(uint256 _id)
```

Emitted when a parcel is destroyed

### ParcelModified

```solidity
event ParcelModified(uint256 _id)
```

Emitted when a parcel is modified

### DiamondStorage

```solidity
struct DiamondStorage {
  mapping(uint256 => mapping(uint256 => uint256)) availabilityIndex;
  mapping(uint256 => struct LibGeoWebParcel.LandParcel) landParcels;
  uint256 nextId;
}
```

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibGeoWebParcel.DiamondStorage ds)
```

### build

```solidity
function build(uint64 baseCoordinate, uint256[] path) internal
```

Build a new parcel. All coordinates along the path must be available. All coordinates are marked unavailable after creation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseCoordinate | uint64 | Base coordinate of new parcel |
| path | uint256[] | Path of new parcel |

### destroy

```solidity
function destroy(uint256 id) internal
```

Destroy an existing parcel. All coordinates along the path are marked as available.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | ID of land parcel |

### nextId

```solidity
function nextId() internal view returns (uint256)
```

The next ID to assign to a parcel

### _updateAvailabilityIndex

```solidity
function _updateAvailabilityIndex(enum LibGeoWebParcel.Action action, uint64 baseCoordinate, uint256[] path) private
```

_Update availability index by traversing a path and marking everything as available or unavailable_

## LibGeoWebParcelV2

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### MAX_PARCEL_DIM

```solidity
uint256 MAX_PARCEL_DIM
```

### LandParcel

```solidity
struct LandParcel {
  uint64 swCoordinate;
  uint256 lngDim;
  uint256 latDim;
}
```

### MAX_INT

```solidity
uint256 MAX_INT
```

_Maxmium uint256 stored as a constant to use for masking_

### DiamondStorage

```solidity
struct DiamondStorage {
  mapping(uint256 => struct LibGeoWebParcelV2.LandParcel) landParcels;
}
```

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibGeoWebParcelV2.DiamondStorage ds)
```

### build

```solidity
function build(struct LibGeoWebParcelV2.LandParcel parcel) internal
```

Build a new parcel. All coordinates along the path must be available. All coordinates are marked unavailable after creation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| parcel | struct LibGeoWebParcelV2.LandParcel | New parcel |

### _updateAvailabilityIndex

```solidity
function _updateAvailabilityIndex(struct LibGeoWebParcelV2.LandParcel parcel) private
```

_Update availability index by traversing a path and marking everything as available or unavailable_

## LibPCOLicenseClaimer

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### DiamondStorage

```solidity
struct DiamondStorage {
  uint256 auctionStart;
  uint256 auctionEnd;
  uint256 startingBid;
  uint256 endingBid;
  address beacon;
  mapping(uint256 => address) beaconProxies;
  mapping(address => uint256) userSalts;
}
```

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibPCOLicenseClaimer.DiamondStorage ds)
```

### _requiredBid

```solidity
function _requiredBid() internal view returns (uint256)
```

the current dutch auction price of a parcel.

## LibPCOLicenseParams

### STORAGE_POSITION

```solidity
bytes32 STORAGE_POSITION
```

### DiamondStorage

```solidity
struct DiamondStorage {
  contract ICFABeneficiary beneficiary;
  contract ISuperToken paymentToken;
  contract ISuperfluid host;
  uint256 perSecondFeeNumerator;
  uint256 perSecondFeeDenominator;
  uint256 penaltyNumerator;
  uint256 penaltyDenominator;
  uint256 bidPeriodLengthInSeconds;
  uint256 reclaimAuctionLength;
  uint256 minForSalePrice;
}
```

### diamondStorage

```solidity
function diamondStorage() internal pure returns (struct LibPCOLicenseParams.DiamondStorage ds)
```

