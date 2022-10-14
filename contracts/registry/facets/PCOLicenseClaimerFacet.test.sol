// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibPCOLicenseClaimer.sol";
import "./PCOLicenseClaimerFacet.sol";

contract FuzzyPCOLicenseClaimerFacet is PCOLicenseClaimerFacet {
    constructor() {
        // Initialize params
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();
        ds.auctionStart = 0;
        ds.auctionEnd = 1;
        ds.startingBid = 2;
        ds.endingBid = 3;
        ds.beacon = address(0x1);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_params_never_change() public view returns (bool) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return
            ds.auctionStart == 0 &&
            ds.auctionEnd == 1 &&
            ds.startingBid == 2 &&
            ds.endingBid == 3 &&
            ds.beacon == address(0x1);
    }
}
