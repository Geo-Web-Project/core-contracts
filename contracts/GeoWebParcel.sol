// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GeoWebCoordinate.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice GeoWebParcel manages the formation and representation of land parcels
contract GeoWebParcel is AccessControl {
    using GeoWebCoordinate for uint64;
    using GeoWebCoordinatePath for uint256;

    bytes32 public constant BUILD_ROLE = keccak256("BUILD_ROLE");

    struct LandParcel {
        uint64 baseCoordinate;
        uint256[] path;
    }

    /// @notice Stores which coordinates are available
    mapping(uint256 => mapping(uint256 => uint256)) public availabilityIndex;

    /// @notice Stores which coordinates belong to a parcel
    mapping(uint256 => LandParcel) landParcels;

    /// @dev The next ID to assign to a parcel
    uint256 maxId;

    /// @notice Emitted when a parcel is built
    event ParcelBuilt(uint256 indexed _id);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        maxId = 0;
    }

    function build(uint64 baseCoordinate, uint256[] calldata path)
        external
        onlyRole(BUILD_ROLE)
        returns (uint256 newParcelId)
    {
        require(path.length > 0, "Path must have at least component");

        uint64 currentCoord = baseCoordinate;

        uint256 p_i = 0;
        uint256 currentPath = path[p_i];

        (uint256 i_x, uint256 i_y, uint256 i) = currentCoord._toWordIndex();
        uint256 word = availabilityIndex[i_x][i_y];

        do {
            // Check if coordinate is available
            require((word & (2**i) == 0), "Coordinate is not available");

            // Mark coordinate as unavailable in memory
            word = word | (2**i);

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
                availabilityIndex[i_x][i_y] = word;

                // Advance to next word
                word = availabilityIndex[new_i_x][new_i_y];
            }

            i_x = new_i_x;
            i_y = new_i_y;
        } while (true);

        // Update last word in storage
        availabilityIndex[i_x][i_y] = word;

        LandParcel storage p = landParcels[maxId];
        p.baseCoordinate = baseCoordinate;
        p.path = path;

        emit ParcelBuilt(maxId);

        newParcelId = maxId;

        maxId += 1;
    }

    function getLandParcel(uint256 id)
        public
        view
        returns (uint64 baseCoordinate, uint256[] memory path)
    {
        LandParcel storage p = landParcels[id];
        return (p.baseCoordinate, p.path);
    }
}
