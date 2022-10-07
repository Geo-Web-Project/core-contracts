// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IDiamondLoupe} from "diamond-1-hardhat/contracts/interfaces/IDiamondLoupe.sol";

library LibBeaconDiamond {
    bytes32 private constant STORAGE_POSITION =
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

        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    function setBeacon(IDiamondLoupe beacon) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.beacon = beacon;
    }
}
