// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcel.sol";
import "./GeoWebParcelFacet.sol";

contract TestableGeoWebParcelFacet is GeoWebParcelFacet {
    function build(LibGeoWebParcel.LandParcelV2 memory parcel) external {
        LibGeoWebParcel.build(parcel);
    }
}
