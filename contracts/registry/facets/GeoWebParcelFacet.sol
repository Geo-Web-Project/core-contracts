// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcel.sol";
import "../libraries/LibGeoWebParcelV2.sol";
import {IGeoWebParcelV1, IGeoWebParcelV2} from "../interfaces/IGeoWebParcel.sol";

/// @title Public access to parcel data
contract GeoWebParcelFacetV1 is IGeoWebParcelV1 {
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
     * @notice Get a land parcel
     * @param id ID of land parcel
     */
    function getLandParcel(uint256 id)
        external
        view
        virtual
        returns (uint64 baseCoordinate, uint256[] memory path)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        LibGeoWebParcel.LandParcel storage p = ds.landParcels[id];
        return (p.baseCoordinate, p.path);
    }
}

/// @title Public access to parcel data
contract GeoWebParcelFacetV2 is GeoWebParcelFacetV1, IGeoWebParcelV2 {
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
        LibGeoWebParcelV2.DiamondStorage storage ds = LibGeoWebParcelV2
            .diamondStorage();

        LibGeoWebParcelV2.LandParcel storage p = ds.landParcels[id];
        return (p.swCoordinate, p.latDim, p.lngDim);
    }
}
