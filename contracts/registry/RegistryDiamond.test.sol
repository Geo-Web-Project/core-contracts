// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./libraries/LibGeoWebParcel.sol";
import "./libraries/LibPCOLicenseParams.sol";
import "./facets/GeoWebParcelFacet.sol";
import "./facets/PCOERC721Facet.sol";
import "./facets/PCOLicenseClaimerFacet.sol";
import "./facets/PCOLicenseParamsFacet.sol";

contract FuzzyRegistryDiamond is GeoWebParcelFacet, PCOLicenseParamsFacet {
    using LibGeoWebCoordinate for uint64;

    constructor() {
        // Initialize params
        LibPCOLicenseParams._initializeParams();
        // ps.beneficiary = beneficiary;
        // ps.paymentToken = paymentToken;
        // ps.host = host;
        // ps.perSecondFeeNumerator = 10;
        // ps.perSecondFeeDenominator = 3153600000;
        // ps.penaltyNumerator = 1;
        // ps.penaltyDenominator = 10;
        // ps.bidPeriodLengthInSeconds = 60 * 60 * 24 * 7;
        // ps.reclaimAuctionLength = 60 * 60 * 24 * 14;
        // ps.minForSalePrice = 5000000000000000;

        // Build a single parcel
        uint256[] memory path = new uint256[](1);
        path[0] = 0;
        LibGeoWebParcel.build(17179869217, path);
    }

    /* PCOLicenseParams */
    // solhint-disable-next-line func-name-mixedcase
    function echidna_params_never_change() public view returns (bool) {
        LibPCOLicenseParams.DiamondStorage storage ps = LibPCOLicenseParams
            .diamondStorage();
        // ps.beneficiary = beneficiary;
        // ps.paymentToken = paymentToken;
        // ps.host = host;

        return
            ps.perSecondFeeNumerator == 10 &&
            ps.perSecondFeeDenominator == 3153600000 &&
            ps.penaltyNumerator == 1 &&
            ps.penaltyDenominator == 10 &&
            ps.bidPeriodLengthInSeconds == 60 * 60 * 24 * 7 &&
            ps.reclaimAuctionLength == 60 * 60 * 24 * 14 &&
            ps.minForSalePrice == 5000000000000000;
    }

    /* GeoWebParcelFacet */

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
