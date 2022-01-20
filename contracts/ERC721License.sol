// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721License is ERC721, Pausable, AccessControl {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
    bytes32 public constant BURN_ROLE = keccak256("BURN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() ERC721("Geo Web Parcel License", "GEOL") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
    }

    modifier onlyRole(bytes32 role) {
        require(
            hasRole(role, _msgSender()),
            "AccessControl: account is missing role"
        );
        _;
    }

    /**
     * @notice Pause the contract. Pauses transfers.
     */
    function pause() external onlyRole(PAUSE_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     */
    function unpause() external onlyRole(PAUSE_ROLE) {
        _unpause();
    }

    /**
     * @dev MINT_ROLE can mint a new license
     */
    function safeMint(address to, uint256 tokenId)
        external
        onlyRole(MINT_ROLE)
    {
        _safeMint(to, tokenId);
    }

    /**
     * @dev BURN_ROLE can burn a license
     */
    function burn(uint256 tokenId) external onlyRole(BURN_ROLE) {
        _burn(tokenId);
    }

    /**
     * @dev Override isApprovedForAll to always return true for an operator with the OPERATOR_ROLE. This allows for partial common ownership of licenses.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        return
            hasRole(OPERATOR_ROLE, operator) ||
            super.isApprovedForAll(owner, operator);
    }

    // Override to check whenNotPaused before transfers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
