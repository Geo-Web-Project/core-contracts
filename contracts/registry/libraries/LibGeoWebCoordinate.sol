// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @title LibGeoWebCoordinate is an unsigned 64-bit integer that contains x and y coordinates in the upper and lower 32 bits, respectively
library LibGeoWebCoordinate {
    // Fixed grid size is 2^23 longitude by 2^22 latitude
    uint64 public constant MAX_X = ((2**23) - 1);
    uint64 public constant MAX_Y = ((2**22) - 1);

    /// @notice Traverse a single direction
    /// @param origin The origin coordinate to start from
    /// @param direction The direction to take
    /// @return destination The destination coordinate
    function traverse(
        uint64 origin,
        uint256 direction,
        uint256 iX,
        uint256 iY,
        uint256 i
    )
        external
        pure
        returns (
            uint64,
            uint256,
            uint256,
            uint256
        )
    {
        return _traverse(origin, direction, iX, iY, i);
    }

    function _traverse(
        uint64 origin,
        uint256 direction,
        uint256 iX,
        uint256 iY,
        uint256 i
    )
        internal
        pure
        returns (
            uint64,
            uint256,
            uint256,
            uint256
        )
    {
        uint64 originX = _getX(origin);
        uint64 originY = _getY(origin);

        if (direction == 0) {
            // North
            originY += 1;
            require(originY <= MAX_Y, "Direction went too far north!");

            if (originY % 16 == 0) {
                iY += 1;
                i -= 240;
            } else {
                i += 16;
            }
        } else if (direction == 1) {
            // South
            require(originY > 0, "Direction went too far south!");
            originY -= 1;

            if (originY % 16 == 15) {
                iY -= 1;
                i += 240;
            } else {
                i -= 16;
            }
        } else if (direction == 2) {
            // East
            if (originX >= MAX_X) {
                // Wrap to west
                originX = 0;
                iX = 0;
                i -= 15;
            } else {
                originX += 1;
                if (originX % 16 == 0) {
                    iX += 1;
                    i -= 15;
                } else {
                    i += 1;
                }
            }
        } else if (direction == 3) {
            // West
            if (originX == 0) {
                // Wrap to east
                originX = MAX_X;
                iX = MAX_X / 16;
                i += 15;
            } else {
                originX -= 1;
                if (originX % 16 == 15) {
                    iX -= 1;
                    i += 15;
                } else {
                    i -= 1;
                }
            }
        }

        uint64 destination = (originY | (originX << 32));

        return (destination, iX, iY, i);
    }

    /// @notice Get the X coordinate
    function _getX(uint64 coord) internal pure returns (uint64 coordX) {
        coordX = (coord >> 32); // Take first 32 bits
        require(coordX <= MAX_X, "X coordinate is out of bounds");
    }

    /// @notice Get the Y coordinate
    function _getY(uint64 coord) internal pure returns (uint64 coordY) {
        coordY = (coord & ((2**32) - 1)); // Take last 32 bits
        require(coordY <= MAX_Y, "Y coordinate is out of bounds");
    }

    /// @notice Flip a direction
    function _flipDirection(uint256 direction) internal pure returns (uint256) {
        if (direction == 0) {
            return 1;
        } else if (direction == 1) {
            return 0;
        } else if (direction == 2) {
            return 3;
        } else {
            return 2;
        }
    }

    /// @notice Convert coordinate to word index
    function toWordIndex(uint64 coord)
        external
        pure
        returns (
            uint256 iX,
            uint256 iY,
            uint256 i
        )
    {
        return _toWordIndex(coord);
    }

    function _toWordIndex(uint64 coord)
        internal
        pure
        returns (
            uint256 iX,
            uint256 iY,
            uint256 i
        )
    {
        uint256 coordX = uint256(_getX(coord));
        uint256 coordY = uint256(_getY(coord));

        iX = coordX / 16;
        iY = coordY / 16;

        uint256 lX = coordX % 16;
        uint256 lY = coordY % 16;

        i = lY * 16 + lX;
    }
}

/// @notice LibGeoWebCoordinatePath stores a path of directions in a uint256. The most significant 8 bits encodes the length of the path
library LibGeoWebCoordinatePath {
    uint256 private constant INNER_PATH_MASK = (2**(256 - 8)) - 1;
    uint256 private constant PATH_SEGMENT_MASK = (2**2) - 1;

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
