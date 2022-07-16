// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibPCOLicenseParams {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibPCOLicenseParams");

    struct DiamondStorage {
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
