// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/******************************************************************************\
* EIP-2535 Diamonds implementation that uses an external IDiamondLoupe to store facet addresses.
* Can be used to store a single set of facet addresses for many diamonds
/******************************************************************************/

import {LibBeaconDiamond} from "./libraries/LibBeaconDiamond.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";

contract BeaconDiamond {
    using OwnableStorage for OwnableStorage.Layout;

    constructor(address _contractOwner, IDiamondReadable _beacon) payable {
        OwnableStorage.layout().setOwner(_contractOwner);
        LibBeaconDiamond.setBeacon(_beacon);
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    // solhint-disable-next-line no-complex-fallback
    fallback() external payable {
        LibBeaconDiamond.DiamondStorage storage ds = LibBeaconDiamond
            .diamondStorage();

        // get facet from beacon
        address facet = ds.beacon.facetAddress(msg.sig);
        require(facet != address(0), "Diamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}
}
