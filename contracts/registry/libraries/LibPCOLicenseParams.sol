// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";

library LibPCOLicenseParams {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibPCOLicenseParams");

    struct DiamondStorage {
        /// @notice Beneficiary of funds.
        address beneficiary;
        /// @notice Payment token.
        ISuperToken paymentToken;
        /// @notice Superfluid host
        ISuperfluid host;
        /// @notice The numerator of the network-wide per second contribution fee.
        uint256 perSecondFeeNumerator;
        /// @notice The denominator of the network-wide per second contribution fee.
        uint256 perSecondFeeDenominator;
        /// @notice The numerator of the penalty to pay to reject a bid.
        uint256 penaltyNumerator;
        /// @notice The denominator of the penalty to pay to reject a bid.
        uint256 penaltyDenominator;
        /// @notice Bid period length in seconds
        uint256 bidPeriodLengthInSeconds;
        /// @notice when the required bid amount reaches its minimum value.
        uint256 reclaimAuctionLength;
    }

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
