// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibFairLaunchClaimer {
    bytes32 constant STORAGE_POSITION = keccak256("diamond.standard.diamond.storage.LibFairLaunchClaimer");

    struct FairLaunchClaimerStorage {
        /// @notice start time of the genesis land parcel auction.
        uint256 auctionStart;
        /// @notice when the required bid amount reaches its minimum value.
        uint256 auctionEnd;
        /// @notice start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
        uint256 startingBid;
        /// @notice the final/minimum required bid reached and maintained at the end of the auction.
        uint256 endingBid;
    }

    function diamondStorage() internal pure returns (FairLaunchClaimerStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}