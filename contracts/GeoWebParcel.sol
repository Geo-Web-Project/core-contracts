pragma solidity ^0.6.0;

import "./GeoWebCoordinate.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice GeoWebParcel manages the formation and representation of land parcels
contract GeoWebParcel is AccessControl {
    using GeoWebCoordinate for uint64;
    using GeoWebCoordinatePath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct LandParcel {
        uint64 baseCoordinate;
        uint256[] path;
    }

    /// @notice availabilityIndex stores which coordinates are available to include in a parcel
    mapping(uint256 => mapping(uint256 => uint256)) public availabilityIndex;

    mapping(uint256 => LandParcel) public landParcels;

    uint256 maxId;

    constructor(address minter) public {
        _setupRole(MINTER_ROLE, minter);

        maxId = 0;
    }

    function mintLandParcel(uint64 baseCoordinate, uint256[] calldata path)
        external
    {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(path.length > 0, "Path must have at least component");

        uint64 currentCoord = baseCoordinate;

        uint256 p_i = 0;
        uint256 currentPath = path[p_i];
        do {
            (uint256 i_x, uint256 i_y, uint256 i) = currentCoord.toWordIndex();
            uint256 word = availabilityIndex[i_x][i_y];

            // Check if coordinate is available
            require((word & (2**i) == 0), "Coordinate is not available");

            // Mark coordinate as unavailable
            availabilityIndex[i_x][i_y] = word | (2**i);

            // Check if any path remains
            if (!currentPath.hasNext()) {
                // Try next path
                p_i += 1;
                if (p_i >= path.length) {
                    break;
                }
                currentPath = path[p_i];
            }

            // Get next direction
            (uint256 direction, uint256 nextPath) = currentPath.nextDirection();

            // Traverse to next coordinate
            currentCoord = currentCoord.traverse(direction);

            // Set next path
            currentPath = nextPath;
        } while (true);

        LandParcel storage p = landParcels[maxId];
        p.baseCoordinate = baseCoordinate;
        p.path = path;

        maxId += 1;
    }
}
