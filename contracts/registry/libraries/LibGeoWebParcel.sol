// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./LibGeoWebCoordinate.sol";
import "hardhat/console.sol";

library LibGeoWebParcel {
    using LibGeoWebCoordinate for uint64;
    using LibGeoWebCoordinatePath for uint256;

    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibGeoWebParcel");

    /// @dev Structure of a land parcel
    struct LandParcel {
        uint64 baseCoordinate;
        uint256[] path;
    }

    /// @dev Enum for different actions
    enum Action {
        Build,
        Destroy,
        Check
    }

    /// @dev Maxmium uint256 stored as a constant to use for masking
    uint256 constant MAX_INT = 2**256 - 1;

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
        mapping(uint256 => LandParcel) landParcels;
        /// @dev The next ID to assign to a parcel
        uint256 maxId;
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
     * @notice Build a new parcel. All coordinates along the path must be available. All coordinates are marked unavailable after creation.
     * @param baseCoordinate Base coordinate of new parcel
     * @param path Path of new parcel
     */
    function build(uint64 baseCoordinate, uint256[] memory path)
        internal
        returns (uint256 newParcelId)
    {
        require(
            path.length > 0,
            "LibGeoWebParcel: Path must have at least one component"
        );

        DiamondStorage storage ds = diamondStorage();

        // Mark everything as available
        _updateAvailabilityIndex(Action.Build, baseCoordinate, path);

        LandParcel storage p = ds.landParcels[ds.maxId];
        p.baseCoordinate = baseCoordinate;
        p.path = path;

        emit ParcelBuilt(ds.maxId);

        newParcelId = ds.maxId;

        ds.maxId += 1;
    }

    /**
     * @notice Destroy an existing parcel. All coordinates along the path are marked as available.
     * @param id ID of land parcel
     */
    function destroy(uint256 id) internal {
        DiamondStorage storage ds = diamondStorage();

        LandParcel storage p = ds.landParcels[id];

        _updateAvailabilityIndex(Action.Destroy, p.baseCoordinate, p.path);

        delete ds.landParcels[id];

        emit ParcelDestroyed(id);
    }

    /// @dev Update availability index by traversing a path and marking everything as available or unavailable
    function _updateAvailabilityIndex(
        Action action,
        uint64 baseCoordinate,
        uint256[] memory path
    ) private {
        DiamondStorage storage ds = diamondStorage();

        uint64 currentCoord = baseCoordinate;

        uint256 p_i = 0;
        uint256 currentPath = path[p_i];

        (uint256 i_x, uint256 i_y, uint256 i) = currentCoord._toWordIndex();
        uint256 word = ds.availabilityIndex[i_x][i_y];

        do {
            if (action == Action.Build) {
                // Check if coordinate is available
                require(
                    (word & (2**i) == 0),
                    "LibGeoWebParcel: Coordinate is not available"
                );

                // Mark coordinate as unavailable in memory
                word = word | (2**i);
            } else if (action == Action.Destroy) {
                // Mark coordinate as available in memory
                word = word & ((2**i) ^ MAX_INT);
            }

            // Get next direction
            bool hasNext;
            uint256 direction;
            (hasNext, direction, currentPath) = currentPath._nextDirection();

            if (!hasNext) {
                // Try next path
                p_i += 1;
                if (p_i >= path.length) {
                    break;
                }
                currentPath = path[p_i];
                (hasNext, direction, currentPath) = currentPath
                    ._nextDirection();
            }

            // Traverse to next coordinate
            uint256 new_i_x;
            uint256 new_i_y;
            (currentCoord, new_i_x, new_i_y, i) = currentCoord._traverse(
                direction,
                i_x,
                i_y,
                i
            );

            // If new coordinate is in new word
            if (new_i_x != i_x || new_i_y != i_y) {
                // Update word in storage
                ds.availabilityIndex[i_x][i_y] = word;

                // Advance to next word
                word = ds.availabilityIndex[new_i_x][new_i_y];
            }

            i_x = new_i_x;
            i_y = new_i_y;
        } while (true);

        // Update last word in storage
        ds.availabilityIndex[i_x][i_y] = word;
    }
}
