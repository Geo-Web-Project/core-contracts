// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibPCOLicenseParams.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";

/// @title Public access to global Claimer parameters
contract PCOLicenseParamsFacet is IPCOLicenseParamsStore {
    /// @notice the final/minimum required bid reached and maintained at the end of the auction.
    function getReclaimAuctionLength()
        external
        view
        override
        returns (uint256)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.reclaimAuctionLength;
    }
}
