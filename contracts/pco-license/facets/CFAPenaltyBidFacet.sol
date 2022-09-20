// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibCFABasePCO.sol";
import {CFABasePCOFacetModifiers} from "./CFABasePCOFacet.sol";
import "../libraries/LibCFAPenaltyBid.sol";
import "../interfaces/ICFABiddable.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Handles bidding using CFAs and penalities
contract CFAPenaltyBidFacet is ICFABiddable, CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

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
        override
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
        override
        onlyIfPayerBidActive
    {
        LibCFAPenaltyBid.Bid storage _pendingBid = LibCFAPenaltyBid
            .pendingBid();

        // Check if pending bid exists
        require(
            !this.hasPendingBid(),
            "CFAPenaltyBidFacet: Pending bid already exists"
        );

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();

        // Check for sale price
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "CFAPenaltyBidFacet: Incorrect for sale price"
        );

        require(
            newContributionRate >= _currentBid.contributionRate,
            "CFAPenaltyBidFacet: New contribution rate is not high enough"
        );

        // Check operator permissions
        (, uint8 permissions, int96 flowRateAllowance) = cs
            .cfaV1
            .cfa
            .getFlowOperatorData(
                ds.paramsStore.getPaymentToken(),
                msg.sender,
                address(this)
            );

        require(
            LibCFAPenaltyBid._getBooleanFlowOperatorPermissions(
                permissions,
                LibCFAPenaltyBid.FlowChangeType.CREATE_FLOW
            ),
            "CFAPenaltyBidFacet: CREATE_FLOW permission not granted"
        );
        require(
            flowRateAllowance >= newContributionRate,
            "CFAPenaltyBidFacet: CREATE_FLOW permission does not have enough allowance"
        );

        // Save pending bid
        _pendingBid.timestamp = block.timestamp;
        _pendingBid.bidder = msg.sender;
        _pendingBid.contributionRate = newContributionRate;
        _pendingBid.perSecondFeeNumerator = perSecondFeeNumerator;
        _pendingBid.perSecondFeeDenominator = perSecondFeeDenominator;
        _pendingBid.forSalePrice = newForSalePrice;

        emit BidPlaced(msg.sender, newContributionRate, newForSalePrice);

        // Collect deposit
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            newContributionRate
        );
        uint256 requiredCollateral = requiredBuffer + newForSalePrice;
        paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            requiredCollateral
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

        LibCFAPenaltyBid._triggerTransfer();
    }
}
