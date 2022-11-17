// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./../PCOERC721Facet.sol";
import "../../libraries/LibPCOLicenseClaimer.sol";

contract FuzzyPCOERC721Facet is PCOERC721Facet {
    address private echidnaCaller = msg.sender;

    constructor() {
        LibPCOLicenseClaimer.DiamondStorage storage cs = LibPCOLicenseClaimer
            .diamondStorage();

        _safeMint(echidnaCaller, 1);
        cs.beaconProxies[1] = address(this);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_operator_always_approved() public view returns (bool) {
        return _isApprovedOrOwner(address(this), 1);
    }
}
