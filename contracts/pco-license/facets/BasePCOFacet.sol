// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibBasePCO.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles basic PCO functionality
contract BasePCOFacet {
    modifier onlyPayer() {
        require(
            msg.sender == payer(),
            "Only payer is allowed to perform this action"
        );
        _;
    }

    /**
     * @notice Current payer of license
     */
    function payer() public view returns (address) {
        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        return currentBid.bidder;
    }

    /**
     * @notice Current contribution rate of payer
     */
    function contributionRate() public view returns (int96) {
        LibBasePCO.DiamondStorage storage ds = LibBasePCO.diamondStorage();

        IConstantFlowAgreementV1 cfa = ds.paramsStore.getCFA();

        (, int96 flowRate, , ) = cfa.getFlow(
            ds.paramsStore.getPaymentToken(),
            payer(),
            address(this)
        );

        return flowRate;
    }

    /**
     * @notice Current price needed to purchase license
     */
    function forSalePrice() external view returns (uint256) {
        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        int96 _contributionRate = contributionRate();

        if (_contributionRate == currentBid.contributionRate) {
            // Contribution rate has not been changed, use rounded forSalePrice
            return currentBid.forSalePrice;
        } else {
            // Contribution rate was changed, used calculated for sale price
            return LibBasePCO.calculateForSalePrice(_contributionRate);
        }
    }

    /**
     * @notice Is current bid actively being paid
     */
    function isBidActive() external view returns (bool) {
        return contributionRate() > 0;
    }

    /**
     * @notice Edit bid. Must be the current payer
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function editBid(int96 newContributionRate, uint256 newForSalePrice)
        external
        onlyPayer
    {
        LibBasePCO.DiamondStorage storage ds = LibBasePCO.diamondStorage();

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        require(
            LibBasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "BasePCOFacet: Incorrect for sale price"
        );

        IConstantFlowAgreementV1 cfa = ds.paramsStore.getCFA();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        address beneficiary = ds.paramsStore.getBeneficiary();

        // Update flow (payer -> license)
        cfa.updateFlowByOperator(
            paymentToken,
            payer(),
            address(this),
            newContributionRate,
            new bytes(0)
        );

        // Update flow (license -> beneficiary)
        cfa.updateFlow(
            paymentToken,
            beneficiary,
            newContributionRate,
            new bytes(0)
        );

        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        currentBid.timestamp = block.timestamp;
        currentBid.bidder = payer();
        currentBid.contributionRate = newContributionRate;
        currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        currentBid.forSalePrice = newForSalePrice;

        emit LibBasePCO.PayerBidUpdated(
            payer(),
            newContributionRate,
            newForSalePrice
        );
    }
}
