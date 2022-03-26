// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, ContextDefinitions, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IClaimer.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract AuctionSuperApp is SuperAppBase, AccessControlEnumerable, Pausable {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    ISuperfluid private host; // host
    IConstantFlowAgreementV1 private cfa; // the stored constant flow agreement class address
    ISuperToken private acceptedToken; // accepted token

    /// @notice Beneficiary of funds.
    address public beneficiary;

    /// @notice Claimer.
    IClaimer public claimer;

    /// @notice Reclaimer to use when owner contribution is deleted
    IClaimer public reclaimer;

    /// @notice ERC721 License used to find owners.
    IERC721 public license;

    /// @notice Current owner's bid for each parcel
    mapping(uint256 => Bid) public currentOwnerBid;

    /// @notice Outstanding bid for each parcel
    mapping(uint256 => Bid) public outstandingBid;

    /// @notice All old bids for each user that are not the current owner or outstanding
    mapping(address => mapping(uint256 => Bid)) public oldBids;

    /// @notice The numerator of the network-wide per second contribution fee.
    uint256 public perSecondFeeNumerator;
    /// @notice The denominator of the network-wide per second contribution fee.
    uint256 public perSecondFeeDenominator;
    /// @notice The numerator of the penalty to pay to reject a bid.
    uint256 public penaltyNumerator;
    /// @notice The denominator of the penalty to pay to reject a bid.
    uint256 public penaltyDenominator;
    /// @notice Bid period length in seconds
    uint256 public bidPeriodLengthInSeconds;

    /// @dev Last deletion of each user
    mapping(address => uint256) private lastUserDeletion;

    /// @notice Emitted when a bid is placed
    event BidPlaced(
        uint256 indexed _licenseId,
        address indexed _owner,
        address indexed _bidder
    );

    /// @notice Emitted when a bid is accepted
    event BidAccepted(
        uint256 indexed _licenseId,
        address indexed _owner,
        address indexed _bidder
    );

    /// @notice Emitted when a bid is rejected
    event BidRejected(
        uint256 indexed _licenseId,
        address indexed _owner,
        address indexed _bidder
    );

    /// @notice Emitted when a bid is claimed
    event BidClaimed(
        uint256 indexed _licenseId,
        address indexed _owner,
        address indexed _bidder,
        address _claimer
    );

    /// @notice Emitted when a user is deleted
    event UserDeleted(address indexed _user);

    /// @notice Emitted when an owner bid is updated
    event OwnerBidUpdated(uint256 indexed _licenseId, address indexed _owner);

    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed _licenseId, address indexed _bidder);

    /// @notice Emitted when a parcel is reclaimed
    event ParcelReclaimed(uint256 indexed _licenseId, address indexed _bidder);

    enum Action {
        CLAIM,
        BID
    }

    struct Bid {
        uint256 timestamp;
        address bidder;
        int96 contributionRate;
        uint256 perSecondFeeNumerator;
        uint256 perSecondFeeDenominator;
        uint256 forSalePrice;
    }

    constructor(
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa,
        ISuperToken _acceptedToken,
        address _beneficiary,
        address _license,
        address _claimer,
        address _reclaimer,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator,
        uint256 _penaltyNumerator,
        uint256 _penaltyDenominator,
        uint256 _bidPeriodLengthInSeconds
    ) {
        require(address(_host) != address(0), "host is zero address");
        require(address(_cfa) != address(0), "cfa is zero address");
        require(
            address(_acceptedToken) != address(0),
            "acceptedToken is zero address"
        );
        require(
            address(_beneficiary) != address(0),
            "beneficiary is zero address"
        );
        require(address(_claimer) != address(0), "claimer is zero address");
        require(address(_reclaimer) != address(0), "reclaimer is zero address");
        require(address(_license) != address(0), "license is zero address");
        require(!_host.isApp(ISuperApp(_beneficiary)), "beneficiary is an app");

        host = _host;
        cfa = _cfa;
        acceptedToken = _acceptedToken;
        beneficiary = _beneficiary;
        license = IERC721(_license);
        claimer = IClaimer(_claimer);
        reclaimer = IClaimer(_reclaimer);
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
        penaltyNumerator = _penaltyNumerator;
        penaltyDenominator = _penaltyDenominator;
        bidPeriodLengthInSeconds = _bidPeriodLengthInSeconds;

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP;

        host.registerApp(configWord);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
    }

    /**
     * @notice Admin can update the claimer.
     * @param _claimer The new claimer address
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setClaimer(address _claimer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        claimer = IClaimer(_claimer);
    }

    /**
     * @notice Admin can update the reclaimer.
     * @param _reclaimer The new reclaimer address
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setReclaimer(address _reclaimer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        reclaimer = IClaimer(_reclaimer);
    }

    /**
     * @notice Admin can update the beneficiary.
     * @param _beneficiary The new beneficiary of contributions
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setBeneficiary(address _beneficiary)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!host.isApp(ISuperApp(_beneficiary)), "beneficiary is an app");

        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            beneficiary
        );

        if (flowRate > 0) {
            // Delete flow to old beneficiary
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    beneficiary,
                    new bytes(0)
                ),
                "0x"
            );

            // Create flow to new beneficiary
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    _beneficiary,
                    flowRate,
                    new bytes(0)
                ),
                "0x"
            );
        }

        beneficiary = _beneficiary;
    }

    /**
     * @notice Admin can update the license.
     * @param licenseAddress The new license used to find owners
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setLicense(address licenseAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        license = IERC721(licenseAddress);
    }

    /**
     * @notice Admin can update the global contribution fee.
     * @param _perSecondFeeNumerator The numerator of the network-wide per second contribution fee
     * @param _perSecondFeeDenominator The denominator of the network-wide per second contribution fee
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setPerSecondFee(
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
    }

    /**
     * @notice Admin can update the penalty fee.
     * @param _penaltyNumerator The numerator of the penalty to pay to reject a bid
     * @param _penaltyDenominator The denominator of the penalty to pay to reject a bid
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setPenalty(uint256 _penaltyNumerator, uint256 _penaltyDenominator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        penaltyNumerator = _penaltyNumerator;
        penaltyDenominator = _penaltyDenominator;
    }

    /**
     * @notice Admin can set bid period.
     * @param _bidPeriodLengthInSeconds The new bid period
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setBidPeriod(uint256 _bidPeriodLengthInSeconds)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        bidPeriodLengthInSeconds = _bidPeriodLengthInSeconds;
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
     * @notice Calculate the penalty needed for the current bid to be rejected
     * @param id Parcel id to purchase
     * @return Penalty in wei
     */
    function calculatePenalty(uint256 id) public view returns (uint256) {
        Bid storage bid = currentOwnerBid[id];

        // Value * Per Second Fee = Contribution Rate
        uint256 currentPurchasePrice = (uint96(bid.contributionRate) *
            bid.perSecondFeeDenominator) / bid.perSecondFeeNumerator;

        uint256 value = (currentPurchasePrice * penaltyNumerator) /
            penaltyDenominator;

        return value;
    }

    /**
     * @notice Calculate the current purchase price of a parcel.
     * @param id Parcel id to purchase
     * @return Current purchase price in wei
     */
    function calculatePurchasePrice(uint256 id) public view returns (uint256) {
        Bid storage bid = currentOwnerBid[id];
        return bid.forSalePrice;
    }

    /**
     * @notice Get the current effective contribution rate of a license
     * @param id Parcel id
     * @return Current contribution rate
     */
    function ownerBidContributionRate(uint256 id) public view returns (int96) {
        address owner = license.ownerOf(id);
        uint256 lastOwnerDeletion = lastUserDeletion[owner];
        Bid storage bid = currentOwnerBid[id];

        // Override to 0 if flow is deleted after bid
        if (lastOwnerDeletion > bid.timestamp) {
            return 0;
        }

        return bid.contributionRate;
    }

    function claimOutstandingBid(uint256 id) external {
        Bid storage bidOutstanding = outstandingBid[id];

        require(
            bidOutstanding.contributionRate > 0,
            "AuctionSuperApp: Outstanding bid does not exist"
        );
        require(
            bidOutstanding.timestamp < block.timestamp,
            "AuctionSuperApp: Outstanding bid must be in past"
        );

        uint256 elapsedTime = block.timestamp - bidOutstanding.timestamp;
        int96 oldOwnerBidContributionRate = ownerBidContributionRate(id);
        if (oldOwnerBidContributionRate > 0) {
            require(
                elapsedTime >= bidPeriodLengthInSeconds,
                "AuctionSuperApp: Bid period has not elapsed"
            );
        }

        Bid storage bid = currentOwnerBid[id];

        // Transfer deposit to owner
        uint256 depositAmount = calculatePurchasePrice(id);
        address oldOwner = bid.bidder;
        bool success = acceptedToken.transfer(oldOwner, depositAmount);
        require(success, "AuctionSuperApp: Transfer deposit failed");

        int96 updatedRate = bidOutstanding.contributionRate -
            oldOwnerBidContributionRate;
        int96 bidContributionRate = bidOutstanding.contributionRate;

        // Update currentOwnerBid
        currentOwnerBid[id] = bidOutstanding;

        // Clear outstanding bid
        bidOutstanding.contributionRate = 0;

        _decreaseAppToUserFlow(bidOutstanding.bidder, bidContributionRate);

        _increaseAppToBeneficiaryFlow(updatedRate);

        if (oldOwnerBidContributionRate > 0) {
            _increaseAppToUserFlow(oldOwner, oldOwnerBidContributionRate);
        }

        // Transfer license
        license.safeTransferFrom(oldOwner, bidOutstanding.bidder, id);

        emit BidClaimed(id, oldOwner, bidOutstanding.bidder, msg.sender);
    }

    function _increaseAppToBeneficiaryFlow(int96 amount) private {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            beneficiary
        );

        if (flowRate > 0) {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    beneficiary,
                    flowRate + amount,
                    new bytes(0)
                ),
                "0x"
            );
        } else {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    beneficiary,
                    amount,
                    new bytes(0)
                ),
                "0x"
            );
        }
    }

    function _increaseAppToBeneficiaryFlowWithCtx(
        bytes memory ctx,
        int96 amount
    ) private returns (bytes memory newCtx) {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            beneficiary
        );

        if (flowRate > 0) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    beneficiary,
                    flowRate + amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        } else {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    beneficiary,
                    amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _decreaseAppToBeneficiaryFlow(bytes memory ctx, int96 amount)
        private
        returns (bytes memory newCtx)
    {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            beneficiary
        );

        if (amount < flowRate) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    beneficiary,
                    flowRate - amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        } else if (flowRate > 0) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    beneficiary,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _increaseAppToUserFlow(address user, int96 amount) private {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            user
        );

        if (flowRate > 0) {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    user,
                    flowRate + amount,
                    new bytes(0)
                ),
                "0x"
            );
        } else {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    user,
                    amount,
                    new bytes(0)
                ),
                "0x"
            );
        }
    }

    function _increaseAppToUserFlowWithCtx(
        bytes memory ctx,
        address user,
        int96 amount
    ) private returns (bytes memory newCtx) {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            user
        );

        if (flowRate > 0) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    user,
                    flowRate + amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        } else {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    user,
                    amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _decreaseAppToUserFlow(address user, int96 amount) private {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            user
        );

        if (flowRate > amount) {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    user,
                    flowRate - amount,
                    new bytes(0)
                ),
                "0x"
            );
        } else {
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    user,
                    new bytes(0)
                ),
                "0x"
            );
        }
    }

    function _decreaseAppToUserFlowWithCtx(
        bytes memory ctx,
        address user,
        int96 amount
    ) private returns (bytes memory newCtx) {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            user
        );

        if (flowRate > amount) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    user,
                    flowRate - amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        } else {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    user,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _deleteAppToUserFlowWithCtx(bytes memory ctx, address user)
        private
        returns (bytes memory newCtx, int96 amountDeleted)
    {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            user
        );

        newCtx = ctx;
        amountDeleted = flowRate;

        if (flowRate > 0) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    user,
                    new bytes(0)
                ),
                "0x",
                newCtx
            );
        }
    }

    function _onIncreaseUserToApp(
        bytes memory _ctx,
        address user,
        int96 increasedFlowRate
    ) private returns (bytes memory newCtx) {
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(_ctx);
        if (decompiledContext.userData.length == 0) {
            revert("AuctionSuperApp: Empty user data");
        }
        (uint8 action, bytes memory actionData) = abi.decode(
            decompiledContext.userData,
            (uint8, bytes)
        );

        if (action == uint8(Action.CLAIM)) {
            return _claim(_ctx, user, increasedFlowRate, actionData);
        } else if (action == uint8(Action.BID)) {
            return _increaseBid(_ctx, user, increasedFlowRate, actionData);
        } else {
            revert("AuctionSuperApp: Unknown Action");
        }
    }

    function _onDecreaseUserToApp(
        bytes memory _ctx,
        address user,
        int96 decreasedFlowRate
    ) private returns (bytes memory newCtx) {
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(_ctx);
        if (decompiledContext.userData.length == 0) {
            revert("AuctionSuperApp: Empty user data");
        }
        (uint8 action, bytes memory actionData) = abi.decode(
            decompiledContext.userData,
            (uint8, bytes)
        );

        if (action == uint8(Action.CLAIM)) {
            revert("AuctionSuperApp: Cannot decrease flow on CLAIM");
        } else if (action == uint8(Action.BID)) {
            return _decreaseBid(_ctx, user, decreasedFlowRate, actionData);
        } else {
            revert("AuctionSuperApp: Unknown Action");
        }
    }

    function _onDecreaseAppToUser(
        bytes memory _ctx,
        address user,
        int96 decreasedFlowRate
    ) private returns (bytes memory newCtx) {
        // Increase app -> user flow back to original
        return _increaseAppToUserFlowWithCtx(_ctx, user, decreasedFlowRate);
    }

    function _onDeleteUserToApp(
        bytes calldata _ctx,
        address user,
        int96 decreasedFlowRate
    ) private returns (bytes memory newCtx) {
        // Delete app -> user flow
        int96 decreasedAmount;
        (newCtx, decreasedAmount) = _deleteAppToUserFlowWithCtx(_ctx, user);

        // Decrease app -> beneficiary flow by remaining
        newCtx = _decreaseAppToBeneficiaryFlow(
            newCtx,
            decreasedFlowRate - decreasedAmount
        );

        // Mark deletion
        lastUserDeletion[user] = block.timestamp;

        emit UserDeleted(user);
    }

    function _claim(
        bytes memory _ctx,
        address user,
        int96 initialContributionRate,
        bytes memory actionData
    ) private returns (bytes memory newCtx) {
        (uint256 forSalePrice, bytes memory claimData) = abi.decode(
            actionData,
            (uint256, bytes)
        );

        // Get claim price
        uint256 claimPrice = claimer.claimPrice(
            user,
            initialContributionRate,
            claimData
        );

        // Collect claim payment
        bool success = acceptedToken.transferFrom(
            user,
            beneficiary,
            claimPrice
        );
        require(success, "AuctionSuperApp: Claim payment failed");

        // Process claim
        uint256 licenseId = claimer.claim(
            user,
            initialContributionRate,
            claimData
        );

        // Increase app -> beneficiary flow
        newCtx = _increaseAppToBeneficiaryFlowWithCtx(
            _ctx,
            initialContributionRate
        );

        // Set currentOwnerBid
        require(
            _checkForSalePrice(
                forSalePrice,
                initialContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );
        Bid storage bid = currentOwnerBid[licenseId];
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = initialContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = forSalePrice;

        emit ParcelClaimed(licenseId, user);
    }

    function _reclaim(
        bytes memory _ctx,
        address user,
        int96 initialContributionRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        // Get claim price
        uint256 claimPrice = reclaimer.claimPrice(
            user,
            initialContributionRate,
            abi.encode(licenseId)
        );

        // Collect claim payment
        address oldOwner = license.ownerOf(licenseId);
        bool success = acceptedToken.transferFrom(user, oldOwner, claimPrice);
        require(success, "AuctionSuperApp: Claim payment failed");

        // Process claim
        reclaimer.claim(user, initialContributionRate, abi.encode(licenseId));

        // Increase app -> beneficiary flow
        newCtx = _increaseAppToBeneficiaryFlowWithCtx(
            _ctx,
            initialContributionRate
        );

        // Set currentOwnerBid
        require(
            _checkForSalePrice(
                forSalePrice,
                initialContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );
        Bid storage bid = currentOwnerBid[licenseId];
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = initialContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = forSalePrice;

        // Transfer license
        license.safeTransferFrom(oldOwner, user, licenseId);

        emit ParcelReclaimed(licenseId, user);
    }

    function _increaseBid(
        bytes memory _ctx,
        address bidder,
        int96 increasedFlowRate,
        bytes memory actionData
    ) private returns (bytes memory newCtx) {
        (uint256 forSalePrice, bytes memory bidData) = abi.decode(
            actionData,
            (uint256, bytes)
        );

        uint256 licenseId = abi.decode(bidData, (uint256));

        if (license.ownerOf(licenseId) == bidder) {
            return
                _increaseOwnerBid(
                    _ctx,
                    bidder,
                    increasedFlowRate,
                    licenseId,
                    forSalePrice
                );
        } else {
            return
                _placeNewBid(
                    _ctx,
                    bidder,
                    increasedFlowRate,
                    licenseId,
                    forSalePrice
                );
        }
    }

    function _increaseOwnerBid(
        bytes memory _ctx,
        address user,
        int96 increasedFlowRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        Bid storage bidOutstanding = outstandingBid[licenseId];
        Bid storage bid = currentOwnerBid[licenseId];

        bool outstandingBidExists = bidOutstanding.contributionRate > 0;
        int96 newBidAmount = ownerBidContributionRate(licenseId) +
            increasedFlowRate;

        if (outstandingBidExists) {
            if (
                (block.timestamp - bidOutstanding.timestamp) >=
                bidPeriodLengthInSeconds
            ) {
                revert("AuctionSuperApp: Bid period has elapsed");
            }

            if (newBidAmount >= bidOutstanding.contributionRate) {
                // Pay penalty
                uint256 penalty = calculatePenalty(licenseId);
                bool success = acceptedToken.transferFrom(
                    user,
                    beneficiary,
                    penalty
                );
                require(success, "AuctionSuperApp: Penalty payment failed");

                // Update old bid
                oldBids[bidOutstanding.bidder][licenseId] = bidOutstanding;

                // Clear outstanding bid
                bidOutstanding.contributionRate = 0;

                emit BidRejected(licenseId, user, bidOutstanding.bidder);
            }
        }

        // Increase app -> beneficiary flow
        newCtx = _increaseAppToBeneficiaryFlowWithCtx(_ctx, increasedFlowRate);

        // Update currentOwnerBid
        require(
            _checkForSalePrice(
                forSalePrice,
                newBidAmount,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = newBidAmount;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = forSalePrice;

        emit OwnerBidUpdated(licenseId, user);
    }

    function _decreaseBid(
        bytes memory _ctx,
        address user,
        int96 decreasedFlowRate,
        bytes memory actionData
    ) private returns (bytes memory newCtx) {
        (uint256 forSalePrice, bytes memory bidData) = abi.decode(
            actionData,
            (uint256, bytes)
        );

        uint256 licenseId = abi.decode(bidData, (uint256));
        Bid storage bidOutstanding = outstandingBid[licenseId];

        if (license.ownerOf(licenseId) == user) {
            return
                _decreaseOwnerBid(
                    _ctx,
                    user,
                    decreasedFlowRate,
                    licenseId,
                    forSalePrice
                );
        } else if (
            bidOutstanding.contributionRate > 0 && bidOutstanding.bidder == user
        ) {
            revert("AuctionSuperApp: Cannot decrease outstanding bid");
        } else {
            return
                _decreaseOldBid(
                    _ctx,
                    user,
                    decreasedFlowRate,
                    licenseId,
                    forSalePrice
                );
        }
    }

    function _decreaseOwnerBid(
        bytes memory _ctx,
        address user,
        int96 decreasedFlowRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        Bid storage bidOutstanding = outstandingBid[licenseId];
        Bid storage bid = currentOwnerBid[licenseId];

        bool outstandingBidExists = bidOutstanding.contributionRate > 0;

        if (outstandingBidExists) {
            if (decreasedFlowRate != bid.contributionRate) {
                revert(
                    "AuctionSuperApp: Can only decrease entire bid with bid outstanding"
                );
            }

            return _acceptBid(_ctx, licenseId);
        }

        if (decreasedFlowRate > bid.contributionRate) {
            revert(
                "AuctionSuperApp: Cannot decrease bid beyond contribution rate"
            );
        }
        int96 newBidAmount = bid.contributionRate - decreasedFlowRate;

        // Decrease app -> beneficiary flow
        newCtx = _decreaseAppToBeneficiaryFlow(_ctx, decreasedFlowRate);

        // Update currentOwnerBid
        require(
            _checkForSalePrice(
                forSalePrice,
                newBidAmount,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = newBidAmount;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = forSalePrice;

        emit OwnerBidUpdated(licenseId, user);
    }

    function _decreaseOldBid(
        bytes memory _ctx,
        address user,
        int96 decreasedFlowRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        Bid storage oldBid = oldBids[user][licenseId];

        if (decreasedFlowRate > oldBid.contributionRate) {
            revert(
                "AuctionSuperApp: Cannot decrease bid beyond contribution rate"
            );
        }
        int96 newBidAmount = oldBid.contributionRate - decreasedFlowRate;

        // Update oldBid
        require(
            _checkForSalePrice(
                forSalePrice,
                newBidAmount,
                oldBid.perSecondFeeNumerator,
                oldBid.perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );
        oldBid.contributionRate = newBidAmount;
        oldBid.forSalePrice = forSalePrice;

        // Decrease app -> user flow
        newCtx = _decreaseAppToUserFlowWithCtx(_ctx, user, decreasedFlowRate);
    }

    function _placeNewBid(
        bytes memory _ctx,
        address bidder,
        int96 bidContributionRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        if (license.ownerOf(licenseId) == address(0x0)) {
            revert("AuctionSuperApp: Cannot place bid on non-existent license");
        }

        bool outstandingBidExists = outstandingBid[licenseId].contributionRate >
            0;

        if (outstandingBidExists) {
            revert(
                "AuctionSuperApp: Cannot place another bid with one outstanding"
            );
        }

        if (ownerBidContributionRate(licenseId) == 0) {
            // Reclaim
            return
                _reclaim(
                    _ctx,
                    bidder,
                    bidContributionRate,
                    licenseId,
                    forSalePrice
                );
        }

        if (bidContributionRate > currentOwnerBid[licenseId].contributionRate) {
            return
                _setOutstandingBid(
                    _ctx,
                    bidder,
                    bidContributionRate,
                    licenseId,
                    forSalePrice
                );
        } else {
            revert(
                "AuctionSuperApp: New bid must be higher than current owner"
            );
        }
    }

    function _acceptBid(bytes memory _ctx, uint256 licenseId)
        private
        returns (bytes memory newCtx)
    {
        Bid storage bidOutstanding = outstandingBid[licenseId];
        Bid storage bid = currentOwnerBid[licenseId];

        // Transfer deposit to owner
        uint256 depositAmount = calculatePurchasePrice(licenseId);
        address oldOwner = bid.bidder;
        bool success = acceptedToken.transfer(oldOwner, depositAmount);
        require(success, "AuctionSuperApp: Transfer deposit failed");

        int96 updatedRate = bidOutstanding.contributionRate -
            bid.contributionRate;
        int96 bidContributionRate = bidOutstanding.contributionRate;

        // Update currentOwnerBid
        currentOwnerBid[licenseId] = bidOutstanding;

        // Clear outstanding bid
        bidOutstanding.contributionRate = 0;

        newCtx = _decreaseAppToUserFlowWithCtx(
            _ctx,
            bidOutstanding.bidder,
            bidContributionRate
        );

        newCtx = _increaseAppToBeneficiaryFlowWithCtx(newCtx, updatedRate);

        // Transfer license
        license.safeTransferFrom(oldOwner, bidOutstanding.bidder, licenseId);

        emit BidAccepted(licenseId, oldOwner, bidOutstanding.bidder);
    }

    function _setOutstandingBid(
        bytes memory _ctx,
        address bidder,
        int96 bidContributionRate,
        uint256 licenseId,
        uint256 forSalePrice
    ) private returns (bytes memory newCtx) {
        require(
            _checkForSalePrice(
                forSalePrice,
                bidContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "AuctionSuperApp: Incorrect for sale price"
        );

        Bid storage bid = outstandingBid[licenseId];
        bid.timestamp = block.timestamp;
        bid.bidder = bidder;
        bid.contributionRate = bidContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = forSalePrice;

        newCtx = _increaseAppToUserFlowWithCtx(
            _ctx,
            bidder,
            bidContributionRate
        );

        // Collect deposit
        uint256 depositAmount = calculatePurchasePrice(licenseId);
        bool success = acceptedToken.transferFrom(
            bidder,
            address(this),
            depositAmount
        );
        require(success, "AuctionSuperApp: Bid deposit failed");

        emit BidPlaced(licenseId, currentOwnerBid[licenseId].bidder, bidder);
    }

    function _checkForSalePrice(
        uint256 forSalePrice,
        int96 contributionRate,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) private pure returns (bool) {
        uint256 calculatedContributionRate = (forSalePrice *
            _perSecondFeeNumerator) / _perSecondFeeDenominator;

        return calculatedContributionRate == uint96(contributionRate);
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        whenNotPaused
        returns (bytes memory newCtx)
    {
        (address user, ) = abi.decode(_agreementData, (address, address));
        (, int96 flowRate, , ) = cfa.getFlowByID(acceptedToken, _agreementId);

        return _onIncreaseUserToApp(_ctx, user, flowRate);
    }

    function beforeAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata
    )
        external
        view
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        whenNotPaused
        returns (bytes memory cbdata)
    {
        (, int96 flowRate, , ) = cfa.getFlowByID(acceptedToken, _agreementId);
        cbdata = abi.encode(flowRate);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        whenNotPaused
        returns (bytes memory newCtx)
    {
        (address user, ) = abi.decode(_agreementData, (address, address));
        int96 originalFlowRate = abi.decode(_cbdata, (int96));
        (, int96 flowRate, , ) = cfa.getFlowByID(acceptedToken, _agreementId);

        if (originalFlowRate < flowRate) {
            return
                _onIncreaseUserToApp(_ctx, user, flowRate - originalFlowRate);
        } else {
            return
                _onDecreaseUserToApp(_ctx, user, originalFlowRate - flowRate);
        }
    }

    function beforeAgreementTerminated(
        ISuperToken, // _superToken,
        address, // _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata
    ) external view override onlyHost returns (bytes memory cbdata) {
        (, int96 flowRate, , ) = cfa.getFlowByID(acceptedToken, _agreementId);
        cbdata = abi.encode(flowRate);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;

        address user;
        bool isUserToApp;
        {
            (address _sender, address _beneficiary) = abi.decode(
                _agreementData,
                (address, address)
            );
            isUserToApp = _beneficiary == address(this);
            user = isUserToApp ? _sender : _beneficiary;
        }

        int96 originalFlowRate = abi.decode(_cbdata, (int96));
        (, int96 flowRate, , ) = cfa.getFlowByID(acceptedToken, _agreementId);

        if (isUserToApp) {
            return _onDeleteUserToApp(_ctx, user, originalFlowRate - flowRate);
        } else {
            return
                _onDecreaseAppToUser(_ctx, user, originalFlowRate - flowRate);
        }
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return
            ISuperAgreement(agreementClass).agreementType() ==
            keccak256(
                "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
            );
    }

    modifier onlyHost() {
        require(
            msg.sender == address(host),
            "AuctionSuperApp: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(
            _isSameToken(superToken),
            "AuctionSuperApp: not accepted token"
        );
        require(
            _isCFAv1(agreementClass),
            "AuctionSuperApp: only CFAv1 supported"
        );
        _;
    }
}
