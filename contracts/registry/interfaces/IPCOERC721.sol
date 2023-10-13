// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import {IERC721Metadata} from "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";

interface IPCOERC721 is IERC721, IERC721Metadata {
    event TokenURIUpdated(uint256 indexed tokenId, string uri);

    function initializeERC721(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external;

    function updateTokenURI(uint256 tokenId, string calldata uri) external;
}
