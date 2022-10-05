// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFAPenaltyBid.sol";

interface ICFABiddable {
    /// @notice Emitted when for sale price is updated
    event BidPlaced(
        address indexed _bidder,
        int96 contributionRate,
        uint256 forSalePrice
    );

    /**
     * @notice Edit bid
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function editBid(int96 newContributionRate, uint256 newForSalePrice)
        external;

    /**
     * @notice Place a bid to purchase license as msg.sender
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function placeBid(int96 newContributionRate, uint256 newForSalePrice)
        external;
}
