// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/// @title LibGeoWebCoordinate is an unsigned 64-bit integer that contains x and y coordinates in the upper and lower 32 bits, respectively
library LibGeoWebCoordinate {
    // Fixed grid size is 2^22 longitude by 2^21 latitude
    uint64 public constant MAX_X = ((2**22) - 1);
    uint64 public constant MAX_Y = ((2**21) - 1);

    /// @notice Traverse a single direction
    /// @param origin The origin coordinate to start from
    /// @param direction The direction to take
    /// @return destination The destination coordinate
    function traverse(
        uint64 origin,
        uint256 direction,
        uint256 _i_x,
        uint256 _i_y,
        uint256 _i
    )
        external
        pure
        returns (
            uint64 destination,
            uint256 i_x,
            uint256 i_y,
            uint256 i
        )
    {
        return _traverse(origin, direction, _i_x, _i_y, _i);
    }

    function _traverse(
        uint64 origin,
        uint256 direction,
        uint256 _i_x,
        uint256 _i_y,
        uint256 _i
    )
        internal
        pure
        returns (
            uint64 destination,
            uint256 i_x,
            uint256 i_y,
            uint256 i
        )
    {
        uint64 origin_x = _getX(origin);
        uint64 origin_y = _getY(origin);

        i_x = _i_x;
        i_y = _i_y;
        i = _i;

        if (direction == 0) {
            // North
            origin_y += 1;
            require(origin_y <= MAX_Y, "Direction went too far north!");

            if (origin_y % 16 == 0) {
                i_y += 1;
                i -= 240;
            } else {
                i += 16;
            }
        } else if (direction == 1) {
            // South
            require(origin_y > 0, "Direction went too far south!");
            origin_y -= 1;

            if (origin_y % 16 == 15) {
                i_y -= 1;
                i += 240;
            } else {
                i -= 16;
            }
        } else if (direction == 2) {
            // East
            if (origin_x >= MAX_X) {
                // Wrap to west
                origin_x = 0;
                i_x = 0;
                i -= 15;
            } else {
                origin_x += 1;
                if (origin_x % 16 == 0) {
                    i_x += 1;
                    i -= 15;
                } else {
                    i += 1;
                }
            }
        } else if (direction == 3) {
            // West
            if (origin_x == 0) {
                // Wrap to east
                origin_x = MAX_X;
                i_x = MAX_X / 16;
                i += 15;
            } else {
                origin_x -= 1;
                if (origin_x % 16 == 15) {
                    i_x -= 1;
                    i += 15;
                } else {
                    i -= 1;
                }
            }
        }

        destination = (origin_y | (origin_x << 32));
    }

    /// @notice Get the X coordinate
    function _getX(uint64 coord) internal pure returns (uint64 coord_x) {
        coord_x = (coord >> 32); // Take first 32 bits
        require(coord_x <= MAX_X, "X coordinate is out of bounds");
    }

    /// @notice Get the Y coordinate
    function _getY(uint64 coord) internal pure returns (uint64 coord_y) {
        coord_y = (coord & ((2**32) - 1)); // Take last 32 bits
        require(coord_y <= MAX_Y, "Y coordinate is out of bounds");
    }

    /// @notice Convert coordinate to word index
    function toWordIndex(uint64 coord)
        external
        pure
        returns (
            uint256 i_x,
            uint256 i_y,
            uint256 i
        )
    {
        return _toWordIndex(coord);
    }

    function _toWordIndex(uint64 coord)
        internal
        pure
        returns (
            uint256 i_x,
            uint256 i_y,
            uint256 i
        )
    {
        uint256 coord_x = uint256(_getX(coord));
        uint256 coord_y = uint256(_getY(coord));

        i_x = coord_x / 16;
        i_y = coord_y / 16;

        uint256 l_x = coord_x % 16;
        uint256 l_y = coord_y % 16;

        i = l_y * 16 + l_x;
    }
}

/// @notice LibGeoWebCoordinatePath stores a path of directions in a uint256. The most significant 8 bits encodes the length of the path
library LibGeoWebCoordinatePath {
    uint256 constant INNER_PATH_MASK = (2**(256 - 8)) - 1;
    uint256 constant PATH_SEGMENT_MASK = (2**2) - 1;

    /// @notice Get next direction from path
    /// @param path The path to get the direction from
    /// @return hasNext If the path has a next direction
    /// @return direction The next direction taken from path
    /// @return nextPath The next path with the direction popped from it
    function nextDirection(uint256 path)
        external
        pure
        returns (
            bool hasNext,
            uint256 direction,
            uint256 nextPath
        )
    {
        return _nextDirection(path);
    }

    function _nextDirection(uint256 path)
        internal
        pure
        returns (
            bool hasNext,
            uint256 direction,
            uint256 nextPath
        )
    {
        uint256 length = (path >> (256 - 8)); // Take most significant 8 bits
        hasNext = (length > 0);
        if (!hasNext) {
            return (hasNext, 0, 0);
        }
        uint256 _path = (path & INNER_PATH_MASK);

        direction = (_path & PATH_SEGMENT_MASK); // Take least significant 2 bits of path
        nextPath = (_path >> 2) | ((length - 1) << (256 - 8)); // Trim direction from path
    }
}
