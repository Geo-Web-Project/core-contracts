// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../../libraries/LibPCOLicenseParams.sol";
import "./../PCOLicenseParamsFacet.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "../../../beneficiary/interfaces/ICFABeneficiary.sol";

contract FuzzyPCOLicenseParamsFacet is PCOLicenseParamsFacet {
    constructor() {
        // Initialize params
        LibPCOLicenseParams.DiamondStorage storage ps = LibPCOLicenseParams
            .diamondStorage();
        ps.beneficiary = ICFABeneficiary(address(0x1));
        ps.paymentToken = ISuperToken(address(0x2));
        ps.host = ISuperfluid(address(0x3));
        ps.perSecondFeeNumerator = 10;
        ps.perSecondFeeDenominator = 3153600000;
        ps.penaltyNumerator = 1;
        ps.penaltyDenominator = 10;
        ps.bidPeriodLengthInSeconds = 60 * 60 * 24 * 7;
        ps.reclaimAuctionLength = 60 * 60 * 24 * 14;
        ps.minForSalePrice = 5000000000000000;
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_params_never_change() public view returns (bool) {
        LibPCOLicenseParams.DiamondStorage storage ps = LibPCOLicenseParams
            .diamondStorage();

        return
            ps.beneficiary == ICFABeneficiary(address(0x1)) &&
            ps.paymentToken == ISuperToken(address(0x2)) &&
            ps.host == ISuperfluid(address(0x3)) &&
            ps.perSecondFeeNumerator == 10 &&
            ps.perSecondFeeDenominator == 3153600000 &&
            ps.penaltyNumerator == 1 &&
            ps.penaltyDenominator == 10 &&
            ps.bidPeriodLengthInSeconds == 60 * 60 * 24 * 7 &&
            ps.reclaimAuctionLength == 60 * 60 * 24 * 14 &&
            ps.minForSalePrice == 5000000000000000;
    }
}
