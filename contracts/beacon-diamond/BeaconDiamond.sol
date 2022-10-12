// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/******************************************************************************\
* EIP-2535 Diamonds implementation that uses an external IDiamondLoupe to store facet addresses.
* Can be used to store a single set of facet addresses for many diamonds
/******************************************************************************/

import {LibBeaconDiamond} from "./libraries/LibBeaconDiamond.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";
import {Proxy} from "@solidstate/contracts/proxy/Proxy.sol";
import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";

contract BeaconDiamond is Proxy, SafeOwnable {
    using OwnableStorage for OwnableStorage.Layout;

    error BeaconDiamond__NoFacetForSignature();

    constructor(address _contractOwner, IDiamondReadable _beacon) payable {
        OwnableStorage.layout().setOwner(_contractOwner);
        LibBeaconDiamond.setBeacon(_beacon);
    }

    function _getImplementation() internal view override returns (address) {
        LibBeaconDiamond.DiamondStorage storage ds = LibBeaconDiamond
            .diamondStorage();

        address implementation = ds.beacon.facetAddress(msg.sig);

        if (implementation == address(0)) {
            revert BeaconDiamond__NoFacetForSignature();
        }

        return implementation;
    }
}
