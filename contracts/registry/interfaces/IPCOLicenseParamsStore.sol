// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IPCOLicenseParamsStore {
    /// @notice Constant flow agreement
    function getCFA() external view returns (IConstantFlowAgreementV1);

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken);

    /// @notice Beneficiary
    function getBeneficiary() external view returns (address);

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator() external view returns (uint256);

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator() external view returns (uint256);

    /// @notice when the required bid amount reaches its minimum value.
    function getReclaimAuctionLength() external view returns (uint256);
}