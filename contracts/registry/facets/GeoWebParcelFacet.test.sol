// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcel.sol";
import "./GeoWebParcelFacet.sol";

contract TestableGeoWebParcelFacet is GeoWebParcelFacet {
    function build(uint64 baseCoordinate, uint256[] memory path) external {
        LibGeoWebParcel.build(baseCoordinate, path);
    }

    function destroy(uint64 id) external {
        return LibGeoWebParcel.destroy(id);
    }
}

contract FuzzyGeoWebParcelFacet is GeoWebParcelFacet {
    constructor() {
        uint256[] memory path = new uint256[](1);
        path[0] = 0;
        LibGeoWebParcel.build(17179869217, path);
    }

    function build(uint64 baseCoordinate, uint256[] memory path) external {
        LibGeoWebParcel.build(baseCoordinate, path);
    }

    function echidna_coordinate_never_changes_parcel()
        public
        view
        returns (bool)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        LibGeoWebParcel.LandParcel storage p = ds.landParcels[0];

        return p.baseCoordinate == 17179869217;
    }
}
