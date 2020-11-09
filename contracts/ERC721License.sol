// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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

    function approve(address to, uint256 tokenId) public virtual override {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");

        approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        virtual
        override
    {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");

        setApprovalForAll(operator, approved);
    }
}
