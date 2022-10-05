// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface ICFABeneficiary {
    /// @notice Get last deletion for sender
    function getLastDeletion(address sender) external view returns (uint256);
}
