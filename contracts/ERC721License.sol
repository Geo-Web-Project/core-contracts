// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721License is ERC721, Pausable, AccessControl {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");

    constructor() ERC721("Geo Web Parcel License", "GEOL") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Pause the contract. Pauses payments and setting contribution rates.
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function pause()
        external
        onlyRole(PAUSE_ROLE)
    {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function unpause() 
        external 
        onlyRole(PAUSE_ROLE) 
    {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) 
        external 
        onlyRole(MINT_ROLE) 
    {
        _safeMint(to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {  
        return super.supportsInterface(interfaceId);
    }
}