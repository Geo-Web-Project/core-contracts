// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721License is Pausable, AccessControl {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Length of Dutch auction upon a parcel becoming invalid.
    uint256 public dutchAuctionLengthInSeconds;

    /// @notice Emitted when a parcel is purchased
    event ParcelPurchased(
        uint256 indexed parcelId,
        address indexed from,
        address indexed to
    );

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
    }

    /**
     * @notice Admin can update the dutch auction length.
     * @param _dutchAuctionLengthInSeconds The new dutch auction length
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setDutchAuctionLengthInSeconds(
        uint256 _dutchAuctionLengthInSeconds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dutchAuctionLengthInSeconds = _dutchAuctionLengthInSeconds;
    }

    /**
     * @notice Pause the contract. Pauses payments and setting contribution rates.
     * @custom:requires PAUSE_ROLE
     */
    function pause() external onlyRole(PAUSE_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     * @custom:requires PAUSE_ROLE
     */
    function unpause() external onlyRole(PAUSE_ROLE) {
        _unpause();
    }

}
