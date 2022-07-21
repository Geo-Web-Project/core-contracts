// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./LibGeoWebParcel.sol";
import "./LibERC721.sol";

library LibBasePCOLicenseClaimer {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibBasePCOLicenseClaimer");

    /// @notice Emitted when a parcel is purchased
    event ParcelClaimed(uint256 indexed parcelId, address indexed to);

    struct DiamondStorage {
        /// @notice start time of the genesis land parcel auction.
        uint256 auctionStart;
        /// @notice when the required bid amount reaches its minimum value.
        uint256 auctionEnd;
        /// @notice start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
        uint256 startingBid;
        /// @notice the final/minimum required bid reached and maintained at the end of the auction.
        uint256 endingBid;
    }

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    /**
     * @notice Build a parcel and mint a license
     * @param user Address of license owner to be
     * @param baseCoordinate Base coordinate of parcel to claim
     * @param path Path of parcel to claim
     */
    function _buildAndMint(
        address user,
        uint64 baseCoordinate,
        uint256[] memory path
    ) internal returns (uint256 licenseId) {
        DiamondStorage storage ds = diamondStorage();
        require(
            block.timestamp > ds.auctionStart,
            "auction has not started yet"
        );

        /// the licenseId is the same as the parcelId returned from parcel.build()
        licenseId = LibGeoWebParcel.build(baseCoordinate, path);
        LibERC721._safeMint(user, licenseId);

        emit ParcelClaimed(licenseId, user);
    }

    /**
     * @notice the current dutch auction price of a parcel.
     */
    function _requiredBid() internal view returns (uint256) {
        DiamondStorage storage ds = diamondStorage();
        if (block.timestamp > ds.auctionEnd) {
            return ds.endingBid;
        }

        uint256 timeElapsed = block.timestamp - ds.auctionStart;
        uint256 auctionDuration = ds.auctionEnd - ds.auctionStart;
        uint256 priceDecrease = (ds.startingBid * timeElapsed) /
            auctionDuration;
        return ds.startingBid - priceDecrease;
    }
}
