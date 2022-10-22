// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcelV2.sol";

/// @title Public access to parcel data
contract GeoWebParcelFacetV2 {
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
