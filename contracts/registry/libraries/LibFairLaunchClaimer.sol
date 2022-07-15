// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "../ERC721License.sol";

// library LibFairLaunchClaimer {
//     bytes32 constant STORAGE_POSITION =
//         keccak256("diamond.standard.diamond.storage.LibFairLaunchClaimer");

//     /// @notice Emitted when a parcel is purchased
//     event ParcelClaimed(uint256 indexed parcelId, address indexed to);

//     struct DiamondStorage {
//         /// @notice License
//         ERC721License license;
//         /// @notice start time of the genesis land parcel auction.
//         uint256 auctionStart;
//         /// @notice when the required bid amount reaches its minimum value.
//         uint256 auctionEnd;
//         /// @notice start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
//         uint256 startingBid;
//         /// @notice the final/minimum required bid reached and maintained at the end of the auction.
//         uint256 endingBid;
//     }

//     function diamondStorage()
//         internal
//         pure
//         returns (DiamondStorage storage ds)
//     {
//         bytes32 position = STORAGE_POSITION;
//         assembly {
//             ds.slot := position
//         }
//     }

//     /**
//      * @notice the current dutch auction price of a parcel.
//      */
//     function requiredBid() internal view returns (uint256) {
//         DiamondStorage storage ds = diamondStorage();
//         if (block.timestamp > ds.auctionEnd) {
//             return ds.endingBid;
//         }

//         uint256 timeElapsed = block.timestamp - ds.auctionStart;
//         uint256 auctionDuration = ds.auctionEnd - ds.auctionStart;
//         uint256 priceDecrease = (ds.startingBid * timeElapsed) /
//             auctionDuration;
//         return ds.startingBid - priceDecrease;
//     }
// }
