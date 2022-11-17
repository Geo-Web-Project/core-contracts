// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @title Latest version of IGeoWebParcel
interface IGeoWebParcel {
    /**
     * @notice Get availability index for coordinates
     * @param x X coordinate
     * @param y Y coordinate
     */
    function availabilityIndex(uint256 x, uint256 y)
        external
        view
        returns (uint256);

    /**
     * @notice Get a V2 land parcel
     * @param id ID of land parcel
     */
    function getLandParcelV2(uint256 id)
        external
        view
        returns (
            uint64 swCoordinate,
            uint256 latDim,
            uint256 lngDim
        );
}

/// @title V1 of IGeoWebParcel
interface IGeoWebParcelV1 {
    /**
     * @notice Get availability index for coordinates
     * @param x X coordinate
     * @param y Y coordinate
     */
    function availabilityIndex(uint256 x, uint256 y)
        external
        view
        returns (uint256);

    /**
     * @notice Get a land parcel
     * @param id ID of land parcel
     */
    function getLandParcel(uint256 id)
        external
        view
        returns (uint64 baseCoordinate, uint256[] memory path);
}

/// @title V2 of IGeoWebParcel
interface IGeoWebParcelV2 is IGeoWebParcelV1 {
    /**
     * @notice Get a V2 land parcel
     * @param id ID of land parcel
     */
    function getLandParcelV2(uint256 id)
        external
        view
        returns (
            uint64 swCoordinate,
            uint256 latDim,
            uint256 lngDim
        );
}
