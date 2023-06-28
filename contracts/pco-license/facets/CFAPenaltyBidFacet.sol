// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFABasePCO.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import "../interfaces/ICFAPenaltyBid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Handles bidding using CFAs and penalities
contract CFAPenaltyBidFacet is ICFAPenaltyBid, CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    modifier onlyIfPendingBid() {
        // Check if pending bid exists
        require(
            this.hasPendingBid(),
            "CFAPenaltyBidFacet: Pending bid does not exist"
        );
        _;
    }

    modifier onlyIfNotPendingBid() {
        // Check if pending bid exists
        require(
            !this.hasPendingBid(),
            "CFAPenaltyBidFacet: Pending bid exists"
        );
        _;
    }

    modifier onlyAfterBidPeriod() {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();

        uint256 bidPeriodLengthInSeconds = ds
            .paramsStore
            .getBidPeriodLengthInSeconds();
        uint256 elapsedTime = block.timestamp - _pendingBid.timestamp;
        require(
            elapsedTime >= bidPeriodLengthInSeconds ||
                shouldBidPeriodEndEarly(),
            "CFAPenaltyBidFacet: Bid period has not elapsed"
        );
        _;
    }

    modifier onlyDuringBidPeriod() {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();

        uint256 bidPeriodLengthInSeconds = ds
            .paramsStore
            .getBidPeriodLengthInSeconds();
        uint256 elapsedTime = block.timestamp - _pendingBid.timestamp;
        require(
            elapsedTime < bidPeriodLengthInSeconds &&
                !shouldBidPeriodEndEarly(),
            "CFAPenaltyBidFacet: Bid period has elapsed"
        );
        _;
    }

    /**
     * @notice Should bid period end early
     */
    function shouldBidPeriodEndEarly() public view returns (bool) {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        (uint256 timestamp, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            ds.paramsStore.getPaymentToken(),
            _currentBid.bidder,
            address(this)
        );

        return
            timestamp > _pendingBid.timestamp ||
            flowRate == 0 ||
            !LibCFABasePCO._isPayerBidActive();
    }

    /**
     * @notice Get pending bid
     */
    function pendingBid() external pure returns (LibCFAPenaltyBid.Bid memory) {
        LibCFAPenaltyBid.Bid storage bid = LibCFAPenaltyBid.pendingBid();

        return bid;
    }

    /**
     * @notice Checks if there is a pending bid
     */
    function hasPendingBid() external view returns (bool) {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();

        return _pendingBid.contributionRate > 0;
    }

    /**
     * @notice Get penalty payment
     */
    function calculatePenalty() external view returns (uint256) {
        return LibCFAPenaltyBid._calculatePenalty();
    }

    /**
     * @notice Edit bid
     *      - Must be the current payer
     *      - Must have permissions to update flow for payer
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function editBid(int96 newContributionRate, uint256 newForSalePrice)
        external
        onlyPayer
        onlyIfNotPendingBid
    {
        LibCFABasePCO._editBid(newContributionRate, newForSalePrice);
    }

    /**
     * @notice Place a bid to purchase license as msg.sender
     *      - Pending bid must not exist
     *      - Must have permissions to create flow for bidder
     *      - Must have ERC-20 approval of payment token
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function placeBid(int96 newContributionRate, uint256 newForSalePrice)
        external
        onlyIfPayerBidActive
        onlyNotPayer
    {
        LibCFAPenaltyBid._placeBid(
            newContributionRate,
            newForSalePrice,
            new bytes(0)
        );
    }

    /**
     * @notice Edit content hash
     *      - Must be the current payer
     *      - Must have permissions to update flow for payer
     * @param contentHash Content hash for parcel content
     */
    function editContentHash(bytes calldata contentHash) external onlyPayer {
        LibCFABasePCO._editContentHash(contentHash);
    }

    /**
     * @notice Edit bid with content hash
     *      - Must be the current payer
     *      - Must have permissions to update flow for payer
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function editBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external onlyPayer onlyIfNotPendingBid {
        LibCFABasePCO._editBid(
            newContributionRate,
            newForSalePrice,
            contentHash
        );
    }

    /**
     * @notice Place a bid with content hash
     *      - Pending bid must not exist
     *      - Must have permissions to create flow for bidder
     *      - Must have ERC-20 approval of payment token
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function placeBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external onlyIfPayerBidActive onlyNotPayer {
        LibCFAPenaltyBid._placeBid(
            newContributionRate,
            newForSalePrice,
            contentHash
        );
    }

    /**
     * @notice Accept a pending bid as the current payer
     *      - Must be payer
     *      - Pending bid must exist
     *      - Must be within bidding period
     */
    function acceptBid()
        external
        onlyPayer
        onlyIfPendingBid
        onlyDuringBidPeriod
    {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        emit BidAccepted(
            _currentBid.bidder,
            _pendingBid.bidder,
            _currentBid.forSalePrice
        );

        // Reentrancy on ERC721 transfer
        LibCFAPenaltyBid._triggerTransfer();
    }

    /**
     * @notice Reject a pending bid as the current payer
     *      - Must be payer
     *      - Pending bid must exist
     *      - Must be within bidding period
     *      - Must approve penalty amount
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function rejectBid(int96 newContributionRate, uint256 newForSalePrice)
        external
        onlyPayer
        onlyIfPendingBid
        onlyDuringBidPeriod
    {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        emit BidRejected(
            _currentBid.bidder,
            _pendingBid.bidder,
            _currentBid.forSalePrice
        );

        LibCFAPenaltyBid._rejectBid(newContributionRate, newForSalePrice);
    }

    /**
     * @notice Trigger a transfer after bidding period has elapsed
     *      - Pending bid must exist
     *      - Must be after bidding period
     */
    function triggerTransfer() external onlyIfPendingBid onlyAfterBidPeriod {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        emit TransferTriggered(
            msg.sender,
            _currentBid.bidder,
            _pendingBid.bidder,
            _currentBid.forSalePrice
        );

        // Reentrancy on ERC721 transfer
        LibCFAPenaltyBid._triggerTransfer();
    }
}
