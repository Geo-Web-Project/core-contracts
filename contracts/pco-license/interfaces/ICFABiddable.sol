// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface ICFABiddable {
    /// @notice Emitted when for sale price is updated
    event BidPlaced(
        address indexed _bidder,
        int96 contributionRate,
        uint256 forSalePrice
    );

    /**
     * @notice Checks if a pending bid exists
     *      - Bidder must have flowAllowance >= propose contribution rate
     */
    function hasPendingBid() external view returns (bool);

    /**
     * @notice Place a bid to purchase license as msg.sender
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function placeBid(int96 newContributionRate, uint256 newForSalePrice)
        external;
}
