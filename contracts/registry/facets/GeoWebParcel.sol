// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibGeoWebParcel.sol";

/// @title Public access to parcel data
contract GeoWebParcel {
    /**
     * @notice Get a land parcel
     * @param id ID of land parcel
     */
    function getLandParcel(uint256 id)
        public
        view
        returns (uint64 baseCoordinate, uint256[] memory path)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        LibGeoWebParcel.LandParcel storage p = ds.landParcels[id];
        return (p.baseCoordinate, p.path);
    }
}
