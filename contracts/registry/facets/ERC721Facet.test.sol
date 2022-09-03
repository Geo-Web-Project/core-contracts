// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibERC721.sol";
import "./ERC721Facet.sol";

contract TestableERC721Facet is ERC721Facet {
    function mint(address to, uint256 tokenId) external {
        LibERC721._mint(to, tokenId);
    }
}
