// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @notice Handles reclaiming of licenses that are no longer active
interface ICFAReclaimer {
    /// @notice Emitted when a license is reclaimed
    event LicenseReclaimed(address indexed to, uint256 price);

    /**
     * @notice Current price to reclaim
     */
    function reclaimPrice() external view returns (uint256);

    /**
     * @notice Reclaim an inactive license as msg.sender
     * @param maxClaimPrice Max price willing to pay for claim. Prevents front-running
     * @param newContributionRate New contribution rate for license
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     */
    function reclaim(
        uint256 maxClaimPrice,
        int96 newContributionRate,
        uint256 newForSalePrice
    ) external;
}
