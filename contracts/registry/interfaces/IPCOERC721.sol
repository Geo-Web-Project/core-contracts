// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";

interface IPCOERC721 is IERC721 {
    function initializeERC721(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external;
}
