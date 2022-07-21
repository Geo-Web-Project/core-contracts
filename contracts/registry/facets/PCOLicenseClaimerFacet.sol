// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibPCOLicenseClaimer.sol";

contract PCOLicenseClaimerFacet {
    /**
     * @notice the current dutch auction price of a parcel.
     */
    function requiredBid() internal view returns (uint256) {
        return LibBasePCOLicenseClaimer._requiredBid();
    }
}
