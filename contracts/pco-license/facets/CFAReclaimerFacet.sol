// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibCFABasePCO.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../registry/interfaces/ICFABeneficiary.sol";

/// @notice Handles reclaiming of licenses that are no longer active
contract CFAReclaimerFacet is CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    /// @notice Emitted when a license is reclaimed
    event LicenseReclaimed(address indexed to, uint256 price);

    /**
     * @notice Current price to reclaim
     */
    function reclaimPrice() public view returns (uint256) {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is active"
        );
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();

        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        uint256 originalForSalePrice = _currentBid.forSalePrice;
        uint256 startTime = ds.beneficiary.getLastDeletion(address(this));
        uint256 _length = ds.paramsStore.getReclaimAuctionLength();

        if (block.timestamp > startTime + _length) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 priceDecrease = (originalForSalePrice * timeElapsed) / _length;
        return originalForSalePrice - priceDecrease;
    }

    /**
     * @notice Reclaim an inactive license as msg.sender
     *      - Payer bid must be inactive
     *      - Must have permissions to create flow for bidder
     *      - Must have ERC-20 approval of payment token for claimPrice amount
     * @param maxClaimPrice Max price willing to pay for claim. Prevents front-running
     * @param newContributionRate New contribution rate for license
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function reclaim(
        uint256 maxClaimPrice,
        int96 newContributionRate,
        uint256 newForSalePrice
    ) external {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is active"
        );

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        {
            uint256 perSecondFeeNumerator = ds
                .paramsStore
                .getPerSecondFeeNumerator();
            uint256 perSecondFeeDenominator = ds
                .paramsStore
                .getPerSecondFeeDenominator();

            require(
                LibCFABasePCO._checkForSalePrice(
                    newForSalePrice,
                    newContributionRate,
                    perSecondFeeNumerator,
                    perSecondFeeDenominator
                ),
                "CFAReclaimerFacet: Incorrect for sale price"
            );
        }

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        {
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
                "CFAReclaimerFacet: CREATE_FLOW permission not granted"
            );
            require(
                flowRateAllowance >= newContributionRate,
                "CFAReclaimerFacet: CREATE_FLOW permission does not have enough allowance"
            );
        }

        uint256 claimPrice = reclaimPrice();

        require(
            newForSalePrice >= claimPrice,
            "CFAReclaimerFacet: For sale price must be greater than or equal to claim price"
        );

        require(
            maxClaimPrice >= claimPrice,
            "CFAReclaimerFacet: Claim price must be under maximum"
        );

        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        address bidder = _currentBid.bidder;

        _currentBid.timestamp = block.timestamp;
        _currentBid.bidder = msg.sender;
        _currentBid.contributionRate = newContributionRate;
        _currentBid.perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        _currentBid.perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        _currentBid.forSalePrice = newForSalePrice;

        emit LicenseReclaimed(msg.sender, claimPrice);

        {
            // Collect deposit
            uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
                paymentToken,
                newContributionRate
            );
            paymentToken.safeTransferFrom(msg.sender, bidder, claimPrice);
            paymentToken.safeTransferFrom(
                msg.sender,
                address(this),
                requiredBuffer
            );
        }

        // Create bidder flow
        try
            cs.cfaV1.host.callAgreement(
                cs.cfaV1.cfa,
                abi.encodeCall(
                    cs.cfaV1.cfa.createFlowByOperator,
                    (
                        paymentToken,
                        msg.sender,
                        address(this),
                        newContributionRate,
                        new bytes(0)
                    )
                ),
                new bytes(0)
            )
        {} catch {}

        // Update beneficiary flow
        LibCFABasePCO._createBeneficiaryFlow(newContributionRate);

        // Transfer license
        ds.license.safeTransferFrom(bidder, msg.sender, ds.licenseId);
    }
}
