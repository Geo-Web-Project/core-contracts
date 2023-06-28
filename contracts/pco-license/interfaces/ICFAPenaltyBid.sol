// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFAPenaltyBid.sol";

interface ICFAPenaltyBid {
    /// @notice Emitted when for sale price is updated
    event BidPlaced(
        address indexed _bidder,
        int96 contributionRate,
        uint256 forSalePrice
    );

    /// @notice Emitted when a bid is accepted
    event BidAccepted(
        address indexed _payer,
        address indexed _bidder,
        uint256 forSalePrice
    );

    /// @notice Emitted when a bid is rejected
    event BidRejected(
        address indexed _payer,
        address indexed _bidder,
        uint256 forSalePrice
    );

    /// @notice Emitted when a transfer is triggered
    event TransferTriggered(
        address indexed _sender,
        address indexed _payer,
        address indexed _bidder,
        uint256 forSalePrice
    );

    /**
     * @notice Should bid period end early
     */
    function shouldBidPeriodEndEarly() external view returns (bool);

    /**
     * @notice Get pending bid
     */
    function pendingBid() external pure returns (LibCFAPenaltyBid.Bid memory);

    /**
     * @notice Checks if there is a pending bid
     */
    function hasPendingBid() external view returns (bool);

    /**
     * @notice Get penalty payment
     */
    function calculatePenalty() external view returns (uint256);

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

    /**
     * @notice Accept a pending bid as the current payer
     */
    function acceptBid() external;

    /**
     * @notice Reject a pending bid as the current payer
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function rejectBid(int96 newContributionRate, uint256 newForSalePrice)
        external;

    /**
     * @notice Trigger a transfer after bidding period has elapsed
     */
    function triggerTransfer() external;

    /**
     * @notice Edit bid with a content hash
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function editBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external;

    /**
     * @notice Place a bid with a content hash
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function placeBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external;

    /**
     * @notice Edit content hash
     *      - Must be the current payer
     *      - Must have permissions to update flow for payer
     * @param contentHash Content hash for parcel content
     */
    function editContentHash(bytes calldata contentHash) external;
}
