// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "./LibCFABasePCO.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library LibCFAPenaltyBid {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    bytes32 private constant STORAGE_POSITION_OUT_BID =
        keccak256(
            "diamond.standard.diamond.storage.LibCFAPenaltyBid.pendingBid"
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
        // solhint-disable-next-line no-inline-assembly
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
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        LibCFABasePCO.Bid memory oldCurrentBid = _currentBid;
        Bid memory _pendingBid = pendingBid();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        // Update current bid
        _currentBid.timestamp = _pendingBid.timestamp;
        _currentBid.bidder = _pendingBid.bidder;
        _currentBid.contributionRate = _pendingBid.contributionRate;
        _currentBid.perSecondFeeNumerator = _pendingBid.perSecondFeeNumerator;
        _currentBid.perSecondFeeDenominator = _pendingBid
            .perSecondFeeDenominator;
        _currentBid.forSalePrice = _pendingBid.forSalePrice;

        // Update pending bid
        _clearPendingBid();

        // Delete payer flow
        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            paymentToken,
            oldCurrentBid.bidder,
            address(this)
        );
        if (flowRate > 0) {
            cs.cfaV1.deleteFlow(
                oldCurrentBid.bidder,
                address(this),
                paymentToken
            );
        }

        // Create bidder flow
        /* solhint-disable no-empty-blocks */
        try
            cs.cfaV1.host.callAgreement(
                cs.cfaV1.cfa,
                abi.encodeCall(
                    cs.cfaV1.cfa.createFlowByOperator,
                    (
                        paymentToken,
                        _pendingBid.bidder,
                        address(this),
                        _pendingBid.contributionRate,
                        new bytes(0)
                    )
                ),
                new bytes(0)
            )
        {} catch {}
        /* solhint-enable no-empty-blocks  */

        // Update beneficiary flow
        address beneficiary = address(LibCFABasePCO._getBeneficiary());
        (, flowRate, , ) = cs.cfaV1.cfa.getFlow(
            paymentToken,
            address(this),
            beneficiary
        );
        if (flowRate > 0) {
            cs.cfaV1.updateFlow(
                beneficiary,
                paymentToken,
                _pendingBid.contributionRate
            );
        } else {
            LibCFABasePCO._createBeneficiaryFlow(_pendingBid.contributionRate);
        }

        // Transfer license
        ds.license.safeTransferFrom(
            oldCurrentBid.bidder,
            _pendingBid.bidder,
            ds.licenseId
        );

        // Transfer payments
        (int256 availableBalance, uint256 deposit, , ) = paymentToken
            .realtimeBalanceOfNow(address(this));
        uint256 remainingBalance = 0;
        if (availableBalance + int256(deposit) >= 0) {
            remainingBalance = uint256(availableBalance + int256(deposit));
        }
        uint256 newBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            _pendingBid.contributionRate
        );
        if (remainingBalance > newBuffer) {
            // Keep full newBuffer
            remainingBalance -= newBuffer;
            uint256 bidderPayment = _pendingBid.forSalePrice -
                oldCurrentBid.forSalePrice;
            if (remainingBalance > bidderPayment) {
                // Transfer bidder full payment
                paymentToken.safeTransfer(_pendingBid.bidder, bidderPayment);
                remainingBalance -= bidderPayment;

                // Transfer remaining to payer
                paymentToken.safeTransfer(
                    oldCurrentBid.bidder,
                    remainingBalance
                );
            } else {
                // Transfer remaining to bidder
                paymentToken.safeTransfer(_pendingBid.bidder, remainingBalance);
            }
        }
    }

    /// @notice Reject Bid
    function _rejectBid(int96 newContributionRate, uint256 newForSalePrice)
        internal
    {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        Bid memory _pendingBid = pendingBid();

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        uint256 penaltyAmount = _calculatePenalty();

        require(
            newContributionRate >= _pendingBid.contributionRate,
            "LibCFAPenaltyBid: New contribution rate must be >= pending bid"
        );

        _clearPendingBid();

        LibCFABasePCO._editBid(newContributionRate, newForSalePrice);

        // Transfer payments
        (int256 availableBalance, uint256 deposit, , ) = paymentToken
            .realtimeBalanceOfNow(address(this));
        uint256 remainingBalance = 0;
        if (availableBalance + int256(deposit) >= 0) {
            remainingBalance = uint256(availableBalance + int256(deposit));
        }
        uint256 newBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            _pendingBid.contributionRate
        );
        if (remainingBalance > deposit) {
            // Keep full deposit
            remainingBalance -= deposit;
            uint256 bidderPayment = _pendingBid.forSalePrice + newBuffer;
            if (remainingBalance > bidderPayment) {
                // Transfer bidder full payment
                paymentToken.safeTransfer(_pendingBid.bidder, bidderPayment);
                remainingBalance -= bidderPayment;

                // Transfer remaining to payer
                paymentToken.safeTransfer(_currentBid.bidder, remainingBalance);
            } else {
                // Transfer remaining to bidder
                paymentToken.safeTransfer(_pendingBid.bidder, remainingBalance);
            }
        }

        paymentToken.safeTransferFrom(
            _currentBid.bidder,
            address(LibCFABasePCO._getBeneficiary()),
            penaltyAmount
        );
    }
}
