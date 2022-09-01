// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IDiamondLoupe} from "hardhat-deploy/solc_0.8/diamond/interfaces/IDiamondLoupe.sol";

library LibBeaconDiamond {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibBeaconDiamond");

    struct DiamondStorage {
        /// @notice Beacon that stores facet addresses
        IDiamondLoupe beacon;
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

    function setBeacon(IDiamondLoupe beacon) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.beacon = beacon;
    }
}
