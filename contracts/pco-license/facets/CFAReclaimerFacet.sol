// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles reclaiming of licenses that are no longer active
contract CFAReclaimerFacet is CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;

    // /**
    //  * @notice Whether reclaiming is currently active
    //  */
    // function isReclaimingActive() view returns (bool) {}

    // /**
    //  * @notice Current price to reclaim
    //  */
    // function claimPrice() view returns (uint256) {}

    // /**
    //  * @notice Reclaim an inactive license as msg.sender
    //  *      - Payer bid must be inactive
    //  *      - Must have permissions to create flow for bidder
    //  *      - Must have ERC-20 approval of payment token for claimPrice amount
    //  */
    // function claim() external {}
}
