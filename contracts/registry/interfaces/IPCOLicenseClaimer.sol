// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcelV2.sol";

/// @title Latest version of IPCOLicenseClaimer
interface IPCOLicenseClaimer {
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed _licenseId, address indexed _payer);
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimedV2(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice Initialize.
     *      - Must be the contract owner
     * @param auctionStart start time of the genesis land parcel auction.
     * @param auctionEnd when the required bid amount reaches its minimum value.
     * @param startingBid start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
     * @param endingBid the final/minimum required bid reached and maintained at the end of the auction.
     * @param beacon The beacon contract for PCO licenses
     */
    function initializeClaimer(
        uint256 auctionStart,
        uint256 auctionEnd,
        uint256 startingBid,
        uint256 endingBid,
        address beacon
    ) external;

    /**
     * @notice Admin can update the starting bid.
     * @param startingBid The new starting bid
     */
    function setStartingBid(uint256 startingBid) external;

    /// @notice Starting bid
    function getStartingBid() external view returns (uint256);

    /**
     * @notice Admin can update the ending bid.
     * @param endingBid The new ending bid
     */
    function setEndingBid(uint256 endingBid) external;

    /// @notice Ending bid
    function getEndingBid() external view returns (uint256);

    /**
     * @notice Admin can update the start time of the initial Dutch auction.
     * @param auctionStart The new start time of the initial Dutch auction
     */
    function setAuctionStart(uint256 auctionStart) external;

    /// @notice Auction start
    function getAuctionStart() external view returns (uint256);

    /**
     * @notice Admin can update the end time of the initial Dutch auction.
     * @param auctionEnd The new end time of the initial Dutch auction
     */
    function setAuctionEnd(uint256 auctionEnd) external;

    /// @notice Auction end
    function getAuctionEnd() external view returns (uint256);

    /**
     * @notice Admin can update the beacon contract
     * @param beacon The new beacon contract
     */
    function setBeacon(address beacon) external;

    /// @notice Get Beacon
    function getBeacon() external view returns (address);

    /**
     * @notice The current dutch auction price of a parcel.
     */
    function requiredBid() external view returns (uint256);

    /**
     * @notice Get beacon proxy for license
     * @param licenseId License ID
     */
    function getBeaconProxy(uint256 licenseId) external view returns (address);

    /**
     * @notice Get the next proxy address for user. To be used to grant permissions before calling claim
     * @param user User address
     */
    function getNextProxyAddress(address user) external view returns (address);

    /**
     * @notice Claim a new parcel and license
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param parcel New parcel
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        LibGeoWebParcelV2.LandParcel memory parcel
    ) external;

    /**
     * @notice Claim a new parcel and license with content hash
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param parcel New parcel
     * @param contentHash Content hash for parcel content
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        LibGeoWebParcelV2.LandParcel memory parcel,
        bytes calldata contentHash
    ) external;
}

/// @title IPCOLicenseClaimerV1 external functions
interface IPCOLicenseClaimerV1 {
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice Initialize.
     *      - Must be the contract owner
     * @param auctionStart start time of the genesis land parcel auction.
     * @param auctionEnd when the required bid amount reaches its minimum value.
     * @param startingBid start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
     * @param endingBid the final/minimum required bid reached and maintained at the end of the auction.
     * @param beacon The beacon contract for PCO licenses
     */
    function initializeClaimer(
        uint256 auctionStart,
        uint256 auctionEnd,
        uint256 startingBid,
        uint256 endingBid,
        address beacon
    ) external;

    /**
     * @notice Admin can update the starting bid.
     * @param startingBid The new starting bid
     */
    function setStartingBid(uint256 startingBid) external;

    /// @notice Starting bid
    function getStartingBid() external view returns (uint256);

    /**
     * @notice Admin can update the ending bid.
     * @param endingBid The new ending bid
     */
    function setEndingBid(uint256 endingBid) external;

    /// @notice Ending bid
    function getEndingBid() external view returns (uint256);

    /**
     * @notice Admin can update the start time of the initial Dutch auction.
     * @param auctionStart The new start time of the initial Dutch auction
     */
    function setAuctionStart(uint256 auctionStart) external;

    /// @notice Auction start
    function getAuctionStart() external view returns (uint256);

    /**
     * @notice Admin can update the end time of the initial Dutch auction.
     * @param auctionEnd The new end time of the initial Dutch auction
     */
    function setAuctionEnd(uint256 auctionEnd) external;

    /// @notice Auction end
    function getAuctionEnd() external view returns (uint256);

    /**
     * @notice Admin can update the beacon contract
     * @param beacon The new beacon contract
     */
    function setBeacon(address beacon) external;

    /// @notice Get Beacon
    function getBeacon() external view returns (address);

    /**
     * @notice The current dutch auction price of a parcel.
     */
    function requiredBid() external view returns (uint256);

    /**
     * @notice Get beacon proxy for license
     * @param licenseId License ID
     */
    function getBeaconProxy(uint256 licenseId) external view returns (address);

    /**
     * @notice Get the next proxy address for user. To be used to grant permissions before calling claim
     * @param user User address
     */
    function getNextProxyAddress(address user) external view returns (address);

    /**
     * @notice Claim a new parcel and license
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param baseCoordinate Base coordinate of new parcel
     * @param path Path of new parcel
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        uint64 baseCoordinate,
        uint256[] memory path
    ) external;
}

/// @title IPCOLicenseClaimerV2 defines new external functions
interface IPCOLicenseClaimerV2 is IPCOLicenseClaimerV1 {
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimedV2(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice Claim a new parcel and license
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param parcel New parcel
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        LibGeoWebParcelV2.LandParcel memory parcel
    ) external;

    /**
     * @notice Claim a new parcel and license with content hash
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param parcel New parcel
     * @param contentHash Content hash for parcel content
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        LibGeoWebParcelV2.LandParcel memory parcel,
        bytes calldata contentHash
    ) external;
}
