// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibCFABasePCO.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Handles reclaiming of licenses that are no longer active
contract CFAReclaimerFacet is CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    struct Data {
        uint256 perSecondFeeNumerator;
        uint256 perSecondFeeDenominator;
        uint256 claimPrice;
        address bidder;
        uint256 requiredBuffer;
        address beneficiary;
        ISuperToken paymentToken;
    }

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
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        uint256 originalForSalePrice = _currentBid.forSalePrice;

        // TODO This is a temporary solution to get the time when the flow is closed
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
     * @param newContributionRate New contribution rate for license
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function reclaim(int96 newContributionRate, uint256 newForSalePrice)
        external
    {
        require(
            !LibCFABasePCO._isPayerBidActive(),
            "CFAReclaimerFacet: Can only perform action when payer bid is active"
        );

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        Data memory data;

        data.perSecondFeeNumerator = ds.paramsStore.getPerSecondFeeNumerator();
        data.perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();

        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                data.perSecondFeeNumerator,
                data.perSecondFeeDenominator
            ),
            "CFAReclaimerFacet: Incorrect for sale price"
        );

        data.paymentToken = ds.paramsStore.getPaymentToken();
        data.requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            data.paymentToken,
            newContributionRate
        );

        require(
            data.paymentToken.balanceOf(msg.sender) >=
                newForSalePrice + data.requiredBuffer,
            "CFAReclaimerFacet: Insufficient balance"
        );
        require(
            data.paymentToken.allowance(msg.sender, address(this)) >=
                newForSalePrice + data.requiredBuffer,
            "CFAReclaimerFacet: Insufficient allowance"
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
            "CFAReclaimerFacet: CREATE_FLOW permission not granted"
        );
        require(
            flowRateAllowance >= newContributionRate,
            "CFAReclaimerFacet: CREATE_FLOW permission does not have enough allowance"
        );

        data.claimPrice = reclaimPrice();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        _currentBid.timestamp = block.timestamp;
        _currentBid.bidder = msg.sender;
        _currentBid.contributionRate = newContributionRate;
        _currentBid.perSecondFeeNumerator = data.perSecondFeeNumerator;
        _currentBid.perSecondFeeDenominator = data.perSecondFeeDenominator;
        _currentBid.forSalePrice = newForSalePrice;

        emit LicenseReclaimed(msg.sender, data.claimPrice);

        // Collect deposit
        data.bidder = _currentBid.bidder;
        data.paymentToken.safeTransferFrom(
            msg.sender,
            data.bidder,
            data.claimPrice
        );
        data.paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            data.requiredBuffer
        );

        // Create bidder flow
        try
            cs.cfaV1.host.callAgreement(
                cs.cfaV1.cfa,
                abi.encodeCall(
                    cs.cfaV1.cfa.createFlowByOperator,
                    (
                        data.paymentToken,
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
        data.beneficiary = ds.paramsStore.getBeneficiary();
        cs.cfaV1.createFlow(
            data.beneficiary,
            data.paymentToken,
            newContributionRate
        );

        // Transfer license
        ds.license.safeTransferFrom(
            _currentBid.bidder,
            msg.sender,
            ds.licenseId
        );
    }
}
