pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

/// @notice GeoWebCoordinate is an unsigned 64-bit integer that contains x and y coordinates in the upper and lower 32 bits, respectively
library GeoWebCoordinate {
    using SafeMath for uint256;

    /// @notice Represents a direction in a path
    enum Direction {North, South, East, West}

    // Fixed grid size is 2^24 longitude by 2^23 latitude, roughly 10 square meters of area at the equator
    uint64 constant MAX_X = ((2**24) - 1);
    uint64 constant MAX_Y = ((2**23) - 1);

    /// @notice Traverse a single direction
    /// @param origin The origin coordinate to start from
    /// @param direction The direction to take
    /// @return destination The destination coordinate
    function traverse(uint64 origin, uint256 direction)
        public
        pure
        returns (uint64 destination)
    {
        uint64 origin_x = getX(origin);
        uint64 origin_y = getY(origin);

        Direction dir = Direction(direction);
        if (dir == Direction.North) {
            origin_y += 1;
            require(origin_y <= MAX_Y, "Direction went too far north!");
        } else if (dir == Direction.South) {
            origin_y -= 1;
            require(origin_y >= 0, "Direction went too far south!");
        } else if (dir == Direction.East) {
            if (origin_x >= MAX_X) {
                // Wrap to west
                origin_x = 0;
            } else {
                origin_x += 1;
            }
        } else if (dir == Direction.West) {
            if (origin_x == 0) {
                // Wrap to east
                origin_x = MAX_X;
            } else {
                origin_x -= 1;
            }
        }

        destination = (origin_y | (origin_x << 32));
    }

    /// @notice Get the X coordinate
    function getX(uint64 coord) public pure returns (uint64 coord_x) {
        coord_x = (coord >> 32); // Take first 32 bits
        require(coord_x <= MAX_X, "X coordinate is out of bounds");
    }

    /// @notice Get the Y coordinate
    function getY(uint64 coord) public pure returns (uint64 coord_y) {
        coord_y = (coord & ((2**32) - 1)); // Take last 32 bits
        require(coord_y <= MAX_Y, "Y coordinate is out of bounds");
    }

    /// @notice Convert coordinate to word index
    function toWordIndex(uint64 coord)
        public
        pure
        returns (
            uint256 i_x,
            uint256 i_y,
            uint256 i
        )
    {
        uint256 coord_x = uint256(getX(coord));
        uint256 coord_y = uint256(getY(coord));

        i_x = coord_x.div(16);
        i_y = coord_y.div(16);
        i = (coord_x.mod(16) + 1).mul(coord_y.mod(16) + 1);
    }
}

/// @notice GeoWebCoordinatePath stores a path of directions in a uint256. The most significant 8 bits encodes the length of the path
library GeoWebCoordinatePath {
    uint256 constant INNER_PATH_MASK = (2**(256 - 8)) - 1;
    uint256 constant PATH_SEGMENT_MASK = (2**2) - 1;

    /// @notice Get next direction from path
    /// @param path The path to get the direction from
    /// @return direction The next direction taken from path
    /// @return nextPath The next path with the direction popped from it
    function nextDirection(uint256 path)
        public
        pure
        returns (uint256 direction, uint256 nextPath)
    {
        uint256 length = (path >> (256 - 8)); // Take most significant 8 bits
        uint256 _path = (path & INNER_PATH_MASK);

        direction = (_path & PATH_SEGMENT_MASK); // Take least significant 2 bits of path
        nextPath = (_path >> 2) | ((length - 1) << (256 - 8)); // Trim direction from path
    }
}
