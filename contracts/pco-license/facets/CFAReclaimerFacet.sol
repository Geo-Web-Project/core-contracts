// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibCFABasePCO.sol";
import "../libraries/LibCFAReclaimer.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles reclaiming of licenses that are no longer active
contract CFAReclaimerFacet is CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;

    /// @notice Emitted when a license is reclaimed
    event LicenseReclaimed(address indexed to, uint256 price);

    /**
     * @notice Current price to reclaim
     */
    function claimPrice() public view returns (uint256) {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is active"
        );
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        uint256 originalForSalePrice = _currentBid.forSalePrice;
        (uint256 startTime, , , ) = cs.cfaV1.cfa.getAccountFlowInfo(
            ds.paramsStore.getPaymentToken(),
            ds.paramsStore.getBeneficiary()
        );
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
     */
    function claim(int96 newContributionRate, uint256 newForSalePrice)
        external
    {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is active"
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

        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "CFAReclaimerFacet: Incorrect for sale price"
        );

        // Collect deposit
        uint256 _claimPrice = claimPrice();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        address _bidder = _currentBid.bidder;
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        bool success = paymentToken.transferFrom(
            msg.sender,
            _bidder,
            _claimPrice
        );
        require(success, "CFAReclaimerFacet: ClaimPrice Deposit failed");

        uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            newContributionRate
        );
        bool success1 = paymentToken.transferFrom(
            msg.sender,
            address(this),
            requiredBuffer
        );
        require(success1, "CFAReclaimerFacet: Bid Deposit failed");

        LibCFAReclaimer._triggerTransfer(
            newContributionRate,
            newForSalePrice,
            perSecondFeeDenominator,
            perSecondFeeNumerator,
            paymentToken
        );

        emit LicenseReclaimed(msg.sender, _claimPrice);
    }
}
