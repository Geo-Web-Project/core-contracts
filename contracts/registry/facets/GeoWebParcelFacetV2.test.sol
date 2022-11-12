// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibGeoWebParcelV2.sol";
import "../libraries/LibGeoWebParcel.sol";
import "./GeoWebParcelFacetV2.sol";

contract TestableGeoWebParcelFacetV2 is GeoWebParcelFacetV2 {
    function build(LibGeoWebParcelV2.LandParcel memory parcel) external {
        LibGeoWebParcelV2.build(parcel);
    }
}

contract FuzzyGeoWebParcelFacetV2 is GeoWebParcelFacetV2 {
    using LibGeoWebCoordinateV2 for uint64;

    constructor() {
        // Build a single parcel
        LibGeoWebParcelV2.LandParcel memory p;
        p.swCoordinate = 17179869217;
        p.lngDim = 1;
        p.latDim = 1;
        LibGeoWebParcelV2.build(p);
    }

    function build(LibGeoWebParcelV2.LandParcel memory parcel) external {
        LibGeoWebParcelV2.build(parcel);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_coordinate_never_changes_parcel()
        public
        view
        returns (bool)
    {
        LibGeoWebParcelV2.DiamondStorage storage ds = LibGeoWebParcelV2
            .diamondStorage();

        LibGeoWebParcelV2.LandParcel storage p = ds.landParcels[0];

        return p.swCoordinate == 17179869217 && p.lngDim == 1 && p.latDim == 1;
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_coordinate_never_is_available()
        public
        view
        returns (bool)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        uint64 swCoordinate = 17179869217;
        (uint256 iX, uint256 iY, uint256 i) = swCoordinate._toWordIndex();
        uint256 word = ds.availabilityIndex[iX][iY];

        return (word & (2**i) != 0);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_next_id_never_repeats() public view returns (bool) {
        return LibGeoWebParcel.nextId() != 0;
    }
}
