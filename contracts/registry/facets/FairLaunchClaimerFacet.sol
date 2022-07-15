// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "../interfaces/IClaimer.sol";
// import "../libraries/LibFairLaunchClaimer.sol";
// import "../libraries/LibGeoWebParcel.sol";
// import "../libraries/LibDiamond.sol";

// contract FairLaunchClaimer is IClaimer {
//     /**
//      * @notice Admin can update the parcel.
//      * @param user Address of license owner to be
//      * @param initialContributionRate Initial contribution rate of parcel
//      * @param claimData Path of parcel to claim and Base coordinate of parcel to claim
//      */
//     function claim(
//         address user,
//         int96 initialContributionRate,
//         bytes calldata claimData
//     ) external override returns (uint256 licenseId) {
//         LibFairLaunchClaimer.DiamondStorage storage ds = LibFairLaunchClaimer
//             .diamondStorage();
//         require(
//             block.timestamp > ds.auctionStart,
//             "auction has not started yet"
//         );

//         (uint64 baseCoordinate, uint256[] memory path) = abi.decode(
//             claimData,
//             (uint64, uint256[])
//         );

//         /// the licenseId is the same as the parcelId returned from parcel.build()
//         uint256 licenseId = LibGeoWebParcel.build(baseCoordinate, path);
//         ds.license.safeMint(user, licenseId);
//         emit LibFairLaunchClaimer.ParcelClaimed(licenseId, user);

//         return licenseId;
//     }

//     /**
//      * @notice Admin can update the parcel.
//      * all params are noops for this contract
//      * @param user Address of license owner to be
//      * @param initialContributionRate Initial contribution rate of parcel
//      * @param claimData Path of parcel to claim and Base coordinate of parcel to claim
//      */
//     function claimPrice(
//         address user,
//         int96 initialContributionRate,
//         bytes calldata claimData
//     ) external view override returns (uint256) {
//         return LibFairLaunchClaimer.requiredBid();
//     }

//     /**
//      * @notice Admin can update the license.
//      * @param _licenseAddress The new license used to find owners
//      * @custom:requires DEFAULT_ADMIN_ROLE
//      */
//     function setLicense(address _licenseAddress) external {
//         LibDiamond.enforceIsContractOwner();

//         LibFairLaunchClaimer.DiamondStorage storage ds = LibFairLaunchClaimer
//             .diamondStorage();
//         ds.license = ERC721License(_licenseAddress);
//     }
// }
