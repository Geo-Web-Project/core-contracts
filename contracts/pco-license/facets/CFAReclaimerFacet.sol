// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFABasePCO.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import "../interfaces/ICFAReclaimer.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";

/// @notice Handles reclaiming of licenses that are no longer active
contract CFAReclaimerFacet is ICFAReclaimer, CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    /**
     * @notice Current price to reclaim
     */
    function reclaimPrice() public view returns (uint256) {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is not active"
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
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        _reclaim(
            maxClaimPrice,
            newContributionRate,
            newForSalePrice,
            _currentBid.contentHash
        );
    }

    /**
     * @notice Reclaim an inactive license as msg.sender
     * @param maxClaimPrice Max price willing to pay for claim. Prevents front-running
     * @param newContributionRate New contribution rate for license
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function reclaim(
        uint256 maxClaimPrice,
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external {
        _reclaim(
            maxClaimPrice,
            newContributionRate,
            newForSalePrice,
            contentHash
        );
    }

    function _reclaim(
        uint256 maxClaimPrice,
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes memory contentHash
    ) internal {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is not active"
        );

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        require(
            newForSalePrice >= ds.paramsStore.getMinForSalePrice(),
            "CFAReclaimerFacet: Minimum for sale price not met"
        );

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
        _currentBid.contentHash = contentHash;

        emit LicenseReclaimed(msg.sender, claimPrice);

        {
            // Collect deposit
            uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
                ds.paramsStore.getPaymentToken(),
                newContributionRate
            );
            ds.paramsStore.getPaymentToken().safeTransferFrom(
                msg.sender,
                bidder,
                claimPrice
            );
            ds.paramsStore.getPaymentToken().safeTransferFrom(
                msg.sender,
                address(this),
                requiredBuffer
            );
        }

        // Create bidder flow
        cs.cfaV1.host.callAgreement(
            cs.cfaV1.cfa,
            abi.encodeCall(
                cs.cfaV1.cfa.createFlowByOperator,
                (
                    ds.paramsStore.getPaymentToken(),
                    msg.sender,
                    address(this),
                    newContributionRate,
                    new bytes(0)
                )
            ),
            new bytes(0)
        );

        // Update beneficiary flow
        LibCFABasePCO._createBeneficiaryFlow(newContributionRate);

        // Transfer license (reentrancy on ERC721 transfer)
        ds.license.safeTransferFrom(bidder, msg.sender, ds.licenseId);
    }
}
