// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./LibGeoWebParcel.sol";
import "./LibGeoWebCoordinate.sol";

library LibGeoWebParcelV2 {
    using LibGeoWebCoordinate for uint64;

    bytes32 private constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibGeoWebParcelV2");

    uint256 private constant MAX_PARCEL_DIM = 200;

    /// @dev Structure of a land parcel
    struct LandParcel {
        uint64 swCoordinate;
        uint256 lngDim;
        uint256 latDim;
    }

    /// @dev Maxmium uint256 stored as a constant to use for masking
    uint256 private constant MAX_INT = 2**256 - 1;

    struct DiamondStorage {
        /// @notice Stores which coordinates belong to a parcel
        mapping(uint256 => LandParcel) landParcels;
    }

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    /**
     * @notice Build a new parcel. All coordinates along the path must be available. All coordinates are marked unavailable after creation.
     * @param parcel New parcel
     */
    function build(LandParcel memory parcel) internal {
        require(
            parcel.latDim <= MAX_PARCEL_DIM && parcel.latDim > 0,
            "LibGeoWebParcel: Latitude dimension out of bounds"
        );
        require(
            parcel.lngDim <= MAX_PARCEL_DIM && parcel.lngDim > 0,
            "LibGeoWebParcel: Longitude dimension out of bounds"
        );

        LibGeoWebParcel.DiamondStorage storage dsV1 = LibGeoWebParcel
            .diamondStorage();
        DiamondStorage storage dsV2 = diamondStorage();

        // Mark everything as available
        _updateAvailabilityIndex(parcel);

        dsV2.landParcels[dsV1.nextId] = parcel;

        emit LibGeoWebParcel.ParcelBuilt(dsV1.nextId);

        dsV1.nextId += 1;
    }

    /// @dev Update availability index by traversing a path and marking everything as available or unavailable
    function _updateAvailabilityIndex(LandParcel memory parcel) private {
        LibGeoWebParcel.DiamondStorage storage dsV1 = LibGeoWebParcel
            .diamondStorage();

        uint64 currentCoord = parcel.swCoordinate;

        (uint256 iX, uint256 iY, uint256 i) = currentCoord._toWordIndex();
        uint256 word = dsV1.availabilityIndex[iX][iY];

        uint256 lngDir = 2; // East

        for (uint256 lat = 0; lat < parcel.latDim; lat++) {
            for (uint256 lng = 0; lng < parcel.lngDim; lng++) {
                // Check if coordinate is available
                require(
                    (word & (2**i) == 0),
                    "LibGeoWebParcel: Coordinate is not available"
                );

                // Mark coordinate as unavailable in memory
                word = word | (2**i);

                // Get next direction
                uint256 direction;
                if (lng < parcel.lngDim - 1) {
                    direction = lngDir;
                } else if (lat < parcel.latDim - 1) {
                    direction = 0; // North
                    if (lngDir == 2) {
                        lngDir = 3; // West
                    } else {
                        lngDir = 2; // East
                    }
                } else {
                    break;
                }

                // Traverse to next coordinate
                uint256 newIX;
                uint256 newIY;
                (currentCoord, newIX, newIY, i) = currentCoord._traverse(
                    direction,
                    iX,
                    iY,
                    i
                );

                // If new coordinate is in new word
                if (newIX != iX || newIY != iY) {
                    // Update word in storage
                    dsV1.availabilityIndex[iX][iY] = word;

                    // Advance to next word
                    word = dsV1.availabilityIndex[newIX][newIY];
                }

                iX = newIX;
                iY = newIY;
            }
        }

        // Update last word in storage
        dsV1.availabilityIndex[iX][iY] = word;
    }
}
