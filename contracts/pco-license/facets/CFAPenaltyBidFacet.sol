// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibCFABasePCO.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import "../interfaces/ICFABiddable.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles bidding using CFAs and penalities
contract CFAPenaltyBidFacet is ICFABiddable {
    using CFAv1Library for CFAv1Library.InitData;

    /**
     * @notice Checks if a pending bid exists
     *      - Bidder must have flowAllowance >= propose contribution rate
     */
    function hasPendingBid() external view returns (bool) {
        LibCFAPenaltyBid.Bid storage pendingBid = LibCFAPenaltyBid.pendingBid();

        if (pendingBid.contributionRate == 0) {
            return false;
        }

        // Check operator permissions
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        (, uint8 permissions, int96 flowRateAllowance) = cs
            .cfaV1
            .cfa
            .getFlowOperatorData(
                ds.paramsStore.getPaymentToken(),
                pendingBid.bidder,
                address(this)
            );

        return
            LibCFAPenaltyBid._getBooleanFlowOperatorPermissions(
                permissions,
                LibCFAPenaltyBid.FlowChangeType.CREATE_FLOW
            ) && flowRateAllowance >= pendingBid.contributionRate;
    }

    /**
     * @notice Place a bid to purchase license as msg.sender
     *      - Pending bid must not exist
     *      - Must have permissions to create flow for bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function placeBid(int96 newContributionRate, uint256 newForSalePrice)
        external
    {
        LibCFAPenaltyBid.Bid storage pendingBid = LibCFAPenaltyBid.pendingBid();

        // Check if pending bid exists
        require(
            this.hasPendingBid() == false,
            "CFAPenaltyBidFacet: Pending bid already exists"
        );

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();

        // Check for sale price
        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "CFAPenaltyBidFacet: Incorrect for sale price"
        );

        // Check operator permissions
        (, uint8 permissions, int96 flowRateAllowance) = cs
            .cfaV1
            .cfa
            .getFlowOperatorData(
                ds.paramsStore.getPaymentToken(),
                msg.sender,
                address(this)
            );

        require(
            LibCFAPenaltyBid._getBooleanFlowOperatorPermissions(
                permissions,
                LibCFAPenaltyBid.FlowChangeType.CREATE_FLOW
            ),
            "CFAPenaltyBidFacet: CREATE_FLOW permission not granted"
        );
        require(
            flowRateAllowance >= newContributionRate,
            "CFAPenaltyBidFacet: CREATE_FLOW permission does not have enough allowance"
        );

        // Save pending bid
        pendingBid.timestamp = block.timestamp;
        pendingBid.bidder = msg.sender;
        pendingBid.contributionRate = newContributionRate;
        pendingBid.perSecondFeeNumerator = perSecondFeeNumerator;
        pendingBid.perSecondFeeDenominator = perSecondFeeDenominator;
        pendingBid.forSalePrice = newForSalePrice;

        emit BidPlaced(msg.sender, newContributionRate, newForSalePrice);
    }
}
