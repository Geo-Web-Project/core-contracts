// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcel.sol";

/// @title Public access to parcel data
contract GeoWebParcelFacet {
    /**
     * @notice Get availability index for coordinates
     * @param x X coordinate
     * @param y Y coordinate
     */
    function availabilityIndex(uint256 x, uint256 y)
        external
        view
        returns (uint256)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        return ds.availabilityIndex[x][y];
    }

    /**
     * @notice Get a V1 land parcel
     * @param id ID of land parcel
     */
    function getLandParcelV1(uint256 id)
        external
        view
        returns (uint64 baseCoordinate, uint256[] memory path)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        LibGeoWebParcel.LandParcelV1 storage p = ds.landParcelsV1[id];
        return (p.baseCoordinate, p.path);
    }

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
        )
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        LibGeoWebParcel.LandParcelV2 storage p = ds.landParcelsV2[id];
        return (p.swCoordinate, p.latDim, p.lngDim);
    }
}
