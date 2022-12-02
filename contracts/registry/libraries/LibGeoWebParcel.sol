// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./LibGeoWebCoordinate.sol";

library LibGeoWebParcel {
    using LibGeoWebCoordinate for uint64;
    using LibGeoWebCoordinatePath for uint256;

    bytes32 private constant STORAGE_POSITION =
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
        mapping(uint256 => LandParcel) landParcels;
        /// @dev The next ID to assign to a parcel
        uint256 nextId;
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
     * @param baseCoordinate Base coordinate of new parcel
     * @param path Path of new parcel
     */
    function build(uint64 baseCoordinate, uint256[] memory path) internal {
        require(
            path.length > 0,
            "LibGeoWebParcel: Path must have at least one component"
        );

        DiamondStorage storage ds = diamondStorage();

        // Mark everything as available
        _updateAvailabilityIndex(Action.Build, baseCoordinate, path);

        LandParcel storage p = ds.landParcels[ds.nextId];
        p.baseCoordinate = baseCoordinate;
        p.path = path;

        emit ParcelBuilt(ds.nextId);

        ds.nextId += 1;
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

    /**
     * @notice The next ID to assign to a parcel
     */
    function nextId() internal view returns (uint256) {
        DiamondStorage storage ds = diamondStorage();
        return ds.nextId;
    }

    /// @dev Update availability index by traversing a path and marking everything as available or unavailable
    function _updateAvailabilityIndex(
        Action action,
        uint64 baseCoordinate,
        uint256[] memory path
    ) private {
        DiamondStorage storage ds = diamondStorage();

        uint64 currentCoord = baseCoordinate;

        uint256 pI = 0;
        uint256 currentPath = path[pI];

        (uint256 iX, uint256 iY, uint256 i) = currentCoord.toWordIndex();
        uint256 word = ds.availabilityIndex[iX][iY];

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
            LibGeoWebCoordinate.Direction direction;
            (hasNext, direction, currentPath) = currentPath.nextDirection();

            if (!hasNext) {
                // Try next path
                pI += 1;
                if (pI >= path.length) {
                    break;
                }
                currentPath = path[pI];
                (hasNext, direction, currentPath) = currentPath.nextDirection();
            }

            // Traverse to next coordinate
            uint256 newIX;
            uint256 newIY;
            (currentCoord, newIX, newIY, i) = currentCoord.traverse(
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
        } while (true);

        // Update last word in storage
        ds.availabilityIndex[iX][iY] = word;
    }
}
