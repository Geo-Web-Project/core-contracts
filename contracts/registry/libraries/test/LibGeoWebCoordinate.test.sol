// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../LibGeoWebCoordinate.sol";

library LibGeoWebCoordinateTest {
    uint64 public constant MAX_X = ((2**23) - 1);
    uint64 public constant MAX_Y = ((2**22) - 1);

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
        return
            LibGeoWebCoordinate.traverse(
                origin,
                LibGeoWebCoordinate.Direction(direction),
                iX,
                iY,
                i
            );
    }

    function toWordIndex(uint64 coord)
        external
        pure
        returns (
            uint256 iX,
            uint256 iY,
            uint256 i
        )
    {
        return LibGeoWebCoordinate.toWordIndex(coord);
    }
}

/// @notice LibGeoWebCoordinatePath stores a path of directions in a uint256. The most significant 8 bits encodes the length of the path
library LibGeoWebCoordinatePathTest {
    function nextDirection(uint256 path)
        external
        pure
        returns (
            bool hasNext,
            uint256 direction,
            uint256 nextPath
        )
    {
        LibGeoWebCoordinate.Direction directionT;
        (hasNext, directionT, nextPath) = LibGeoWebCoordinatePath.nextDirection(
            path
        );
        direction = uint256(directionT);
    }
}
