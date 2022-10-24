// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcelV2.sol";
import "./GeoWebParcelFacetV2.sol";

contract TestableGeoWebParcelFacetV2 is GeoWebParcelFacetV2 {
    function build(LibGeoWebParcelV2.LandParcel memory parcel) external {
        LibGeoWebParcelV2.build(parcel);
    }
}
