// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GeoWebCoordinate.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title A smart contract that stores what area makes up a parcel and defines the rules for mutating a parcel.
contract GeoWebParcel is Initializable, AccessControlUpgradeable {
  using GeoWebCoordinate for uint64;
  using GeoWebCoordinatePath for uint256;

  bytes32 public constant BUILD_ROLE = keccak256("BUILD_ROLE");
  bytes32 public constant DESTROY_ROLE = keccak256("DESTROY_ROLE");

  /// @dev Maxmium uint256 stored as a constant to use for masking
  uint256 constant MAX_INT = 2**256 - 1;

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

  /// @notice Stores which coordinates are available
  mapping(uint256 => mapping(uint256 => uint256)) public availabilityIndex;

  /// @notice Stores which coordinates belong to a parcel
  mapping(uint256 => LandParcel) landParcels;

  /// @dev The next ID to assign to a parcel
  uint256 maxId;

  /// @notice Emitted when a parcel is built
  event ParcelBuilt(uint256 indexed _id);

  /// @notice Emitted when a parcel is destroyed
  event ParcelDestroyed(uint256 indexed _id);

  /// @notice Emitted when a parcel is modified
  event ParcelModified(uint256 indexed _id);

  function initialize() public initializer {
    __AccessControl_init();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    maxId = 0;
  }

  /**
   * @notice Build a new parcel. All coordinates along the path must be available. All coordinates are marked unavailable after creation.
   * @param baseCoordinate Base coordinate of new parcel
   * @param path Path of new parcel
   * @custom:requires BUILD_ROLE
   */
  function build(uint64 baseCoordinate, uint256[] calldata path)
    external
    onlyRole(BUILD_ROLE)
    returns (uint256 newParcelId)
  {
    require(path.length > 0, "Path must have at least one component");

    // First, only check availability
    _updateAvailabilityIndex(Action.Check, baseCoordinate, path);

    // Then mark everything as available
    _updateAvailabilityIndex(Action.Build, baseCoordinate, path);

    LandParcel storage p = landParcels[maxId];
    p.baseCoordinate = baseCoordinate;
    p.path = path;

    emit ParcelBuilt(maxId);

    newParcelId = maxId;

    maxId += 1;
  }

  /**
   * @notice Destroy an existing parcel. All coordinates along the path are marked as available.
   * @param id ID of land parcel
   * @custom:requires DESTROY_ROLE
   */
  function destroy(uint256 id) external onlyRole(DESTROY_ROLE) {
    LandParcel storage p = landParcels[id];

    _updateAvailabilityIndex(Action.Destroy, p.baseCoordinate, p.path);

    delete landParcels[id];

    emit ParcelDestroyed(id);
  }

  /**
   * @notice Get a land parcel
   * @param id ID of land parcel
   */
  function getLandParcel(uint256 id)
    public
    view
    returns (uint64 baseCoordinate, uint256[] memory path)
  {
    LandParcel storage p = landParcels[id];
    return (p.baseCoordinate, p.path);
  }

  /// @dev Update availability index by traversing a path and marking everything as available or unavailable
  function _updateAvailabilityIndex(
    Action action,
    uint64 baseCoordinate,
    uint256[] memory path
  ) internal {
    uint64 currentCoord = baseCoordinate;

    uint256 p_i = 0;
    uint256 currentPath = path[p_i];

    (uint256 i_x, uint256 i_y, uint256 i) = currentCoord._toWordIndex();
    uint256 word = availabilityIndex[i_x][i_y];

    do {
      if (action == Action.Build) {
        // Mark coordinate as unavailable in memory
        word = word | (2**i);
      } else if (action == Action.Destroy) {
        // Mark coordinate as available in memory
        word = word & ((2**i) ^ MAX_INT);
      } else if (action == Action.Check) {
        // Check if coordinate is available
        require((word & (2**i) == 0), "Coordinate is not available");
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
        (hasNext, direction, currentPath) = currentPath._nextDirection();
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
        if (action != Action.Check) {
          // Update word in storage
          availabilityIndex[i_x][i_y] = word;
        }

        // Advance to next word
        word = availabilityIndex[new_i_x][new_i_y];
      }

      i_x = new_i_x;
      i_y = new_i_y;
    } while (true);

    if (action != Action.Check) {
      // Update last word in storage
      availabilityIndex[i_x][i_y] = word;
    }
  }
}
