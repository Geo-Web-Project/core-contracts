// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "./LibCFABasePCO.sol";

library LibCFAPenaltyBid {
    using CFAv1Library for CFAv1Library.InitData;

    bytes32 constant STORAGE_POSITION_OUT_BID =
        keccak256(
            "diamond.standard.diamond.storage.LibCFAPenaltyBid.outstandingBid"
        );

    struct Bid {
        uint256 timestamp;
        address bidder;
        int96 contributionRate;
        uint256 perSecondFeeNumerator;
        uint256 perSecondFeeDenominator;
        uint256 forSalePrice;
    }

    function pendingBid() internal pure returns (Bid storage ds) {
        bytes32 position = STORAGE_POSITION_OUT_BID;
        assembly {
            ds.slot := position
        }
    }

    /// @dev From ConstantFlowAgreementV1

    enum FlowChangeType {
        CREATE_FLOW,
        UPDATE_FLOW,
        DELETE_FLOW
    }

    function _getBooleanFlowOperatorPermissions(
        uint8 permissions,
        FlowChangeType flowChangeType
    ) internal pure returns (bool flowchangeTypeAllowed) {
        if (flowChangeType == FlowChangeType.CREATE_FLOW) {
            flowchangeTypeAllowed = permissions & uint8(1) == 1;
        } else if (flowChangeType == FlowChangeType.UPDATE_FLOW) {
            flowchangeTypeAllowed = (permissions >> 1) & uint8(1) == 1;
        } else {
            /** flowChangeType === FlowChangeType.DELETE_FLOW */
            flowchangeTypeAllowed = (permissions >> 2) & uint8(1) == 1;
        }
    }

    /// @notice Calculate the penalty needed for the pending bid to be rejected
    function _calculatePenalty() internal view returns (uint256) {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        Bid storage _pendingBid = pendingBid();

        uint256 penaltyNumerator = ds.paramsStore.getPenaltyNumerator();
        uint256 penaltyDenominator = ds.paramsStore.getPenaltyDenominator();

        uint256 value = (_pendingBid.forSalePrice * penaltyNumerator) /
            penaltyDenominator;

        return value;
    }

    function _clearPendingBid() internal {
        Bid storage _pendingBid = pendingBid();
        _pendingBid.contributionRate = 0;
    }

    /// @notice Trigger transfer of license
    function _triggerTransfer() internal {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();
        Bid storage _pendingBid = pendingBid();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        // Delete payer flow
        cs.cfaV1.deleteFlow(currentBid.bidder, address(this), paymentToken);

        // Create bidder flow
        cs.cfaV1.createFlowByOperator(
            _pendingBid.bidder,
            address(this),
            paymentToken,
            _pendingBid.contributionRate
        );

        // Update beneficiary flow
        address beneficiary = ds.paramsStore.getBeneficiary();
        cs.cfaV1.updateFlow(
            beneficiary,
            paymentToken,
            _pendingBid.contributionRate
        );

        // Transfer license
        ds.license.safeTransferFrom(
            currentBid.bidder,
            _pendingBid.bidder,
            ds.licenseId
        );

        // Update current bid
        currentBid.timestamp = _pendingBid.timestamp;
        currentBid.bidder = _pendingBid.bidder;
        currentBid.contributionRate = _pendingBid.contributionRate;
        currentBid.perSecondFeeNumerator = _pendingBid.perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = _pendingBid
            .perSecondFeeDenominator;
        currentBid.forSalePrice = _pendingBid.forSalePrice;

        // Update pending bid
        _clearPendingBid();
    }

    /// @notice Collect penalty payment
    function _collectPenalty() internal {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        address beneficiary = ds.paramsStore.getBeneficiary();

        uint256 penaltyAmount = _calculatePenalty();

        bool success = paymentToken.transferFrom(
            currentBid.bidder,
            beneficiary,
            penaltyAmount
        );
        require(success, "LibCFAPenaltyBid: Penalty payment failed");
    }
}
