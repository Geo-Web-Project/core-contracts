// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IPCOLicenseParamsStore {
    /// @notice Constant flow agreement
    function getCFA() external view returns (IConstantFlowAgreementV1);

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken);

    /// @notice when the required bid amount reaches its minimum value.
    function getReclaimAuctionLength() external view returns (uint256);
}
