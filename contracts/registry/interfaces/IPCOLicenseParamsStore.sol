// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";

interface IPCOLicenseParamsStore {
    /// @notice Superfluid Host
    function getHost() external view returns (ISuperfluid);

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken);

    /// @notice Beneficiary
    function getBeneficiary() external view returns (ICFABeneficiary);

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator() external view returns (uint256);

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator() external view returns (uint256);

    /// @notice The numerator of the penalty rate.
    function getPenaltyNumerator() external view returns (uint256);

    /// @notice The denominator of the penalty rate.
    function getPenaltyDenominator() external view returns (uint256);

    /// @notice when the required bid amount reaches its minimum value.
    function getReclaimAuctionLength() external view returns (uint256);

    /// @notice Bid period length in seconds
    function getBidPeriodLengthInSeconds() external view returns (uint256);

    /// @notice Minimum for sale price
    function getMinForSalePrice() external view returns (uint256);
}
