// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721License is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address admin) public ERC721("GeoWebLicense", "GEO") {
        _setupRole(ADMIN_ROLE, admin);
    }

    function mintLicense(address to, uint256 tokenId) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");

        _safeMint(to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        override
        view
        returns (bool)
    {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        address owner = ownerOf(tokenId);
        return (spender == owner || hasRole(ADMIN_ROLE, spender));
    }
}
