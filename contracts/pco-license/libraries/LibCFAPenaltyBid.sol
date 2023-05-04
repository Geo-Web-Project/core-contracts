// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

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
        bytes contentHash;
    }

    /// @notice Emitted when for sale price is updated
    event BidPlaced(
        address indexed _bidder,
        int96 contributionRate,
        uint256 forSalePrice
    );

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
        _pendingBid.timestamp = block.timestamp;
    }

    /**
     * @notice Place a bid to purchase license as msg.sender
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function _placeBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes memory contentHash
    ) internal {
        Bid storage _pendingBid = pendingBid();

        // Check if pending bid exists
        require(
            _pendingBid.contributionRate <= 0,
            "LibCFAPenaltyBid: Pending bid already exists"
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
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "LibCFAPenaltyBid: Incorrect for sale price"
        );

        require(
            newContributionRate >= _currentBid.contributionRate,
            "LibCFAPenaltyBid: New contribution rate is not high enough"
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
            _getBooleanFlowOperatorPermissions(
                permissions,
                FlowChangeType.CREATE_FLOW
            ),
            "LibCFAPenaltyBid: CREATE_FLOW permission not granted"
        );
        require(
            flowRateAllowance >= newContributionRate,
            "LibCFAPenaltyBid: CREATE_FLOW permission does not have enough allowance"
        );

        // Save pending bid
        _pendingBid.timestamp = block.timestamp;
        _pendingBid.bidder = msg.sender;
        _pendingBid.contributionRate = newContributionRate;
        _pendingBid.perSecondFeeNumerator = perSecondFeeNumerator;
        _pendingBid.perSecondFeeDenominator = perSecondFeeDenominator;
        _pendingBid.forSalePrice = newForSalePrice;
        _pendingBid.contentHash = contentHash;

        emit BidPlaced(msg.sender, newContributionRate, newForSalePrice);

        // Collect deposit
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            newContributionRate
        );
        uint256 requiredCollateral = requiredBuffer + newForSalePrice;
        paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            requiredCollateral
        );
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
        _currentBid.contentHash = _pendingBid.contentHash;

        // Update pending bid
        _clearPendingBid();

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

        // Check if beneficiary flow needs to be deleted
        address beneficiary = address(LibCFABasePCO._getBeneficiary());
        if (remainingBalance < newBuffer) {
            cs.cfaV1.deleteFlow(address(this), beneficiary, paymentToken);

            (availableBalance, deposit, , ) = paymentToken.realtimeBalanceOfNow(
                address(this)
            );
            remainingBalance = uint256(availableBalance + int256(deposit));
        }

        // Create bidder flow
        if (remainingBalance >= newBuffer) {
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
        }

        // Update beneficiary flow
        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
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
        } else if (remainingBalance >= newBuffer) {
            LibCFABasePCO._createBeneficiaryFlow(_pendingBid.contributionRate);
        }

        {
            // Transfer payments
            uint256 withdrawToBidder = 0;
            uint256 withdrawToPayer = 0;

            if (remainingBalance > newBuffer) {
                // Keep full newBuffer
                remainingBalance -= newBuffer;
                uint256 bidderPayment = _pendingBid.forSalePrice -
                    oldCurrentBid.forSalePrice;
                if (remainingBalance > bidderPayment) {
                    // Transfer bidder full payment
                    withdrawToBidder = bidderPayment;
                    remainingBalance -= withdrawToBidder;

                    // Transfer remaining to payer
                    withdrawToPayer = remainingBalance;
                } else {
                    // Transfer remaining to bidder
                    withdrawToBidder = remainingBalance;
                }
            }

            if (withdrawToBidder > 0) {
                paymentToken.safeTransfer(_pendingBid.bidder, withdrawToBidder);
            }
            if (withdrawToPayer > 0) {
                paymentToken.safeTransfer(
                    oldCurrentBid.bidder,
                    withdrawToPayer
                );
            }
        }

        // Delete payer flow (reentrancy on potential SuperApp callback)
        (, flowRate, , ) = cs.cfaV1.cfa.getFlow(
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

        // Transfer license (reentrancy on ERC721 transfer)
        ds.license.safeTransferFrom(
            oldCurrentBid.bidder,
            _pendingBid.bidder,
            ds.licenseId
        );
    }

    /// @notice Reject Bid
    function _rejectBid(int96 newContributionRate, uint256 newForSalePrice)
        internal
    {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        Bid memory _pendingBid = pendingBid();

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        uint256 penaltyAmount = _calculatePenalty();

        require(
            newContributionRate >= _pendingBid.contributionRate,
            "LibCFAPenaltyBid: New contribution rate must be >= pending bid"
        );

        _clearPendingBid();

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

        // Check if beneficiary flow needs to be deleted
        address beneficiary = address(LibCFABasePCO._getBeneficiary());
        if (availableBalance < 0) {
            cs.cfaV1.deleteFlow(address(this), beneficiary, paymentToken);

            (availableBalance, deposit, , ) = paymentToken.realtimeBalanceOfNow(
                address(this)
            );
            remainingBalance = uint256(availableBalance + int256(deposit));
        }

        LibCFABasePCO._editBid(newContributionRate, newForSalePrice);

        uint256 withdrawToBidder = _pendingBid.forSalePrice + newBuffer;
        uint256 withdrawToPayer = 0;
        uint256 depositFromPayer = 0;
        if (remainingBalance > deposit) {
            // Keep full deposit
            remainingBalance -= deposit;
            if (remainingBalance > withdrawToBidder) {
                // Transfer bidder full payment
                remainingBalance -= withdrawToBidder;

                // Transfer remaining to payer
                withdrawToPayer = remainingBalance;
            } else {
                // Transfer depleted amount from payer
                depositFromPayer = withdrawToBidder - remainingBalance;
            }
        } else {
            depositFromPayer = withdrawToBidder;
        }

        // msg.sender is _currentBid.bidder due to onlyPayer modifier check
        if (depositFromPayer > 0) {
            paymentToken.safeTransferFrom(
                msg.sender,
                address(this),
                depositFromPayer
            );
        }
        paymentToken.safeTransfer(_pendingBid.bidder, withdrawToBidder);
        if (withdrawToPayer > 0) {
            paymentToken.safeTransfer(msg.sender, withdrawToPayer);
        }
        paymentToken.safeTransferFrom(
            msg.sender,
            address(LibCFABasePCO._getBeneficiary()),
            penaltyAmount
        );
    }
}
