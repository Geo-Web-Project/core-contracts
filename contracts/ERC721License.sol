// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract ERC721License is ERC721Upgradeable, AccessControlUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    function initialize(address admin) public {
        __ERC721_init("GeoWebLicense", "GEO");

        _setupRole(ADMIN_ROLE, admin);
    }

    function mintLicense(
        address to,
        uint256 tokenId
    ) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");

        _safeMint(to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        override
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
