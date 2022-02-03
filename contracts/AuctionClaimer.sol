// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IClaimer.sol";

contract AuctionClaimer is Pausable, AccessControl, IClaimer {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice start time of the genesis land parcel auction.
    uint256 public auctionStart;
    /// @notice when the required bid amount reaches its minimum value.
    uint256 public auctionEnd;
    /// @notice high start price of the genesis land auction. Decreases at a rate of #TODO.
    uint256 public startingBid;
    /// @notice the final/minimum required bid reached and maintained at the end of the auction. (likely 0 in the case of the Geo Web)
    uint256 public endingBid;

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

    function claim(address user, uint256 initialContributionRate, bytes calldata claimData) external payable {
        require(block.timestamp < auctionStart, "auction has not started yet");
        require(block.timestamp > auctionEnd, "geneisis auction is done, use the Simple Claimer");

        uint256 timeElapsed = block.timestamp - auctionStart;
        uint256 priceDecrease = startingBid * (timeElapsed / auctionEnd);
        uint256 requiredBid = startingBid - priceDecrease;

        require(msg.value >= requiredBid, "bid is too low");
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

    /**
     * @notice Admin can update the starting bid.
     * @param _startingBid The new starting bid
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setStartingBid(uint256 _startingBid) external onlyRole(DEFAULT_ADMIN_ROLE) {
        startingBid = _startingBid;
    }

    /**
     * @notice Admin can update the ending bid.
     * @param _endingBid The new ending bid
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setEndingBid(uint256 _endingBid) external onlyRole(DEFAULT_ADMIN_ROLE) {
        endingBid = _endingBid;
    }

    /**
     * @notice Admin can update the start time of the initial Dutch auction.
     * @param _auctionStart The new start time of the initial Dutch auction
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setAuctionStart(uint256 _auctionStart) external onlyRole(DEFAULT_ADMIN_ROLE) {
        auctionStart = _auctionStart;
    }

    /**
     * @notice Admin can update the end time of the initial Dutch auction.
     * @param _auctionEnd The new end time of the initial Dutch auction
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setAuctionEnd(uint256 _auctionEnd) external onlyRole(DEFAULT_ADMIN_ROLE) {
        auctionEnd = _auctionEnd;
    }
}
