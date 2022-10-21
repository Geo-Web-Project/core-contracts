// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./LibGeoWebCoordinate.sol";

library LibGeoWebParcel {
    using LibGeoWebCoordinate for uint64;

    bytes32 private constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibGeoWebParcel");

    uint256 private constant MAX_PARCEL_DIM = 200;

    /// @dev Structure of a land parcel, path-based
    struct LandParcelV1 {
        uint64 baseCoordinate;
        uint256[] path;
    }

    /// @dev Structure of a land parcel, rectangles
    struct LandParcelV2 {
        uint64 swCoordinate;
        uint256 lngDim;
        uint256 latDim;
    }

    /// @dev Maxmium uint256 stored as a constant to use for masking
    uint256 private constant MAX_INT = 2**256 - 1;

    /// @notice Emitted when a parcel is built
    event ParcelBuilt(uint256 indexed _id);

    /// @notice Emitted when a parcel is destroyed
    event ParcelDestroyed(uint256 indexed _id);

    /// @notice Emitted when a parcel is modified
    event ParcelModified(uint256 indexed _id);

    struct DiamondStorage {
        /// @notice Stores which coordinates are available
        mapping(uint256 => mapping(uint256 => uint256)) availabilityIndex;
        /// @notice Stores which coordinates belong to a parcel
        mapping(uint256 => LandParcelV1) landParcelsV1;
        /// @dev The next ID to assign to a parcel
        uint256 nextId;
        /// @notice Stores which coordinates belong to a parcel
        mapping(uint256 => LandParcelV2) landParcelsV2;
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
    function build(LandParcelV2 memory parcel) internal {
        require(
            parcel.latDim <= MAX_PARCEL_DIM && parcel.latDim > 0,
            "LibGeoWebParcel: Latitude dimension out of bounds"
        );
        require(
            parcel.lngDim <= MAX_PARCEL_DIM && parcel.lngDim > 0,
            "LibGeoWebParcel: Longitude dimension out of bounds"
        );

        DiamondStorage storage ds = diamondStorage();

        // Mark everything as available
        _updateAvailabilityIndex(parcel);

        ds.landParcelsV2[ds.nextId] = parcel;

        emit ParcelBuilt(ds.nextId);

        ds.nextId += 1;
    }

    /**
     * @notice The next ID to assign to a parcel
     */
    function nextId() internal view returns (uint256) {
        DiamondStorage storage ds = diamondStorage();
        return ds.nextId;
    }

    /// @dev Update availability index by traversing a path and marking everything as available or unavailable
    function _updateAvailabilityIndex(LandParcelV2 memory parcel) private {
        DiamondStorage storage ds = diamondStorage();

        uint64 currentCoord = parcel.swCoordinate;

        (uint256 iX, uint256 iY, uint256 i) = currentCoord._toWordIndex();
        uint256 word = ds.availabilityIndex[iX][iY];

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
                    ds.availabilityIndex[iX][iY] = word;

                    // Advance to next word
                    word = ds.availabilityIndex[newIX][newIY];
                }

                iX = newIX;
                iY = newIY;
            }
        }

        // Update last word in storage
        ds.availabilityIndex[iX][iY] = word;
    }
}
