// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPCOLicenseParamsStore {
    /// @notice when the required bid amount reaches its minimum value.
    function getReclaimAuctionLength() external view returns (uint256);
}
