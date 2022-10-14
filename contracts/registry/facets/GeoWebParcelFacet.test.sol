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
    using LibGeoWebCoordinate for uint64;

    constructor() {
        uint256[] memory path = new uint256[](1);
        path[0] = 0;
        LibGeoWebParcel.build(17179869217, path);
    }

    function build(uint64 baseCoordinate, uint256[] memory path) external {
        LibGeoWebParcel.build(baseCoordinate, path);
    }

    // solhint-disable-next-line func-name-mixedcase
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

    // solhint-disable-next-line func-name-mixedcase
    function echidna_coordinate_never_is_available()
        public
        view
        returns (bool)
    {
        LibGeoWebParcel.DiamondStorage storage ds = LibGeoWebParcel
            .diamondStorage();

        uint64 baseCoordinate = 17179869217;
        (uint256 iX, uint256 iY, uint256 i) = baseCoordinate._toWordIndex();
        uint256 word = ds.availabilityIndex[iX][iY];

        return (word & (2**i) != 0);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_next_id_never_repeats() public view returns (bool) {
        return LibGeoWebParcel.nextId() != 0;
    }
}
