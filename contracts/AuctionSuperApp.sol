// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, ContextDefinitions, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IClaimer.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./Accountant.sol";

contract AuctionSuperApp is SuperAppBase, AccessControlEnumerable, Pausable {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    ISuperfluid private host; // host
    IConstantFlowAgreementV1 private cfa; // the stored constant flow agreement class address
    ISuperToken private acceptedToken; // accepted token

    IClaimer public claimer;
    address public receiver;

    /// @notice Accountant.
    Accountant public accountant;
    /// @notice ERC721 License used to find owners.
    IERC721 public license;

    /// @notice Current owner's bid for each parcel
    mapping(uint256 => Bid) public currentOwnerBid;

    /// @notice Outstanding bid for each parcel
    mapping(uint256 => Bid) public outstandingBid;

    /// @notice The numerator of the penalty to pay to reject a bid.
    uint256 public penaltyNumerator;
    /// @notice The denominator of the penalty to pay to reject a bid.
    uint256 public penaltyDenominator;

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
    }

    constructor(
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa,
        ISuperToken _acceptedToken,
        address _receiver,
        address _license,
        address _accountant,
        uint256 _penaltyNumerator,
        uint256 _penaltyDenominator
    ) {
        require(address(_host) != address(0), "host is zero address");
        require(address(_cfa) != address(0), "cfa is zero address");
        require(
            address(_acceptedToken) != address(0),
            "acceptedToken is zero address"
        );
        require(address(_receiver) != address(0), "receiver is zero address");
        require(!_host.isApp(ISuperApp(_receiver)), "receiver is an app");

        host = _host;
        cfa = _cfa;
        acceptedToken = _acceptedToken;
        receiver = _receiver;
        license = IERC721(_license);
        accountant = Accountant(_accountant);
        penaltyNumerator = _penaltyNumerator;
        penaltyDenominator = _penaltyDenominator;

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
     * @notice Admin can update the receiver.
     * @param _receiver The new receiver of contributions
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setReceiver(address _receiver)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!host.isApp(ISuperApp(_receiver)), "receiver is an app");

        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            receiver
        );

        if (flowRate > 0) {
            // Create flow to new receiver
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.createFlow.selector,
                    acceptedToken,
                    _receiver,
                    flowRate,
                    new bytes(0)
                ),
                "0x"
            );

            // Delete flow to old receiver
            host.callAgreement(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    acceptedToken,
                    address(this),
                    receiver,
                    new bytes(0)
                ),
                "0x"
            );
        }

        receiver = _receiver;
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
     * @notice Admin can update the accountant.
     * @param accountantAddress The new accountant
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setAccountant(address accountantAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        accountant = Accountant(accountantAddress);
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
        uint256 currentPurchasePrice = calculatePurchasePrice(id);

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
        uint256 contributionRate = accountant.contributionRates(id);

        // Value * Per Second Fee = Contribution Rate
        uint256 value = (contributionRate *
            accountant.perSecondFeeDenominator()) /
            accountant.perSecondFeeNumerator();

        return value;
    }

    function _increaseAppToReceiverFlow(bytes memory ctx, int96 amount)
        private
        returns (bytes memory newCtx)
    {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            receiver
        );

        if (flowRate > 0) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    receiver,
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
                    receiver,
                    amount,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _decreaseAppToReceiverFlow(bytes memory ctx, int96 amount)
        private
        returns (bytes memory newCtx)
    {
        (, int96 flowRate, , ) = cfa.getFlow(
            acceptedToken,
            address(this),
            receiver
        );

        if (amount < flowRate) {
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.updateFlow.selector,
                    acceptedToken,
                    receiver,
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
                    receiver,
                    new bytes(0)
                ),
                "0x",
                ctx
            );
        }
    }

    function _increaseAppToUserFlow(
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

    function _deleteAppToUserFlow(bytes memory ctx, address user)
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
            return _ctx;
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
        return _increaseAppToUserFlow(_ctx, user, decreasedFlowRate);
    }

    function _onDeleteUserToApp(
        bytes calldata _ctx,
        address user,
        int96 decreasedFlowRate
    ) private returns (bytes memory newCtx) {
        // Delete app -> user flow
        int96 decreasedAmount;
        (newCtx, decreasedAmount) = _deleteAppToUserFlow(_ctx, user);

        // Decrease app -> receiver flow by remaining
        newCtx = _decreaseAppToReceiverFlow(
            newCtx,
            decreasedFlowRate - decreasedAmount
        );
    }

    function _claim(
        bytes memory _ctx,
        address user,
        int96 initialContributionRate,
        bytes memory claimData
    ) private returns (bytes memory newCtx) {
        // Get claim price
        uint256 claimPrice = claimer.claimPrice(
            user,
            initialContributionRate,
            claimData
        );

        // Collect claim payment
        bool success = acceptedToken.transferFrom(user, receiver, claimPrice);
        require(success, "AuctionSuperApp: Claim payment failed");

        // Process claim
        uint256 licenseId = claimer.claim(
            user,
            initialContributionRate,
            claimData
        );

        // Increase app -> receiver flow
        newCtx = _increaseAppToReceiverFlow(_ctx, initialContributionRate);

        // Set currentOwnerBid
        Bid storage bid = currentOwnerBid[licenseId];
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = initialContributionRate;
        bid.perSecondFeeNumerator = accountant.perSecondFeeNumerator();
        bid.perSecondFeeDenominator = accountant.perSecondFeeDenominator();
    }

    function _increaseBid(
        bytes memory _ctx,
        address bidder,
        int96 increasedFlowRate,
        bytes memory actionData
    ) private returns (bytes memory newCtx) {
        uint256 licenseId = abi.decode(actionData, (uint256));

        if (license.ownerOf(licenseId) == bidder) {
            return
                _increaseOwnerBid(_ctx, bidder, increasedFlowRate, licenseId);
        } else {
            return _placeNewBid(_ctx, bidder, increasedFlowRate, licenseId);
        }
    }

    function _increaseOwnerBid(
        bytes memory _ctx,
        address user,
        int96 increasedFlowRate,
        uint256 licenseId
    ) private returns (bytes memory newCtx) {
        Bid storage bidOutstanding = outstandingBid[licenseId];
        Bid storage bid = currentOwnerBid[licenseId];

        bool outstandingBidExists = bidOutstanding.contributionRate > 0;
        int96 newBidAmount = bid.contributionRate + increasedFlowRate;

        if (
            outstandingBidExists &&
            newBidAmount >= bidOutstanding.contributionRate
        ) {
            // Update to new contribution
            accountant.setContributionRate(licenseId, uint96(newBidAmount));

            // Pay penalty
            uint256 penalty = calculatePenalty(licenseId);
            bool success = acceptedToken.transferFrom(user, receiver, penalty);
            require(success, "AuctionSuperApp: Penalty payment failed");

            // Clear outstanding bid
            bidOutstanding.contributionRate = 0;

            // TODO: Lower outstanding bid flows
        }

        // Increase app -> receiver flow
        newCtx = _increaseAppToReceiverFlow(_ctx, increasedFlowRate);

        // Update currentOwnerBid
        bid.timestamp = block.timestamp;
        bid.bidder = user;
        bid.contributionRate = newBidAmount;
        bid.perSecondFeeNumerator = accountant.perSecondFeeNumerator();
        bid.perSecondFeeDenominator = accountant.perSecondFeeDenominator();
    }

    function _placeNewBid(
        bytes memory _ctx,
        address bidder,
        int96 bidContributionRate,
        uint256 licenseId
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

        if (bidContributionRate > currentOwnerBid[licenseId].contributionRate) {
            return
                _setOutstandingBid(
                    _ctx,
                    bidder,
                    bidContributionRate,
                    licenseId
                );
        } else {
            revert(
                "AuctionSuperApp: New bid must be higher than current owner"
            );
        }
    }

    function _setOutstandingBid(
        bytes memory _ctx,
        address bidder,
        int96 bidContributionRate,
        uint256 licenseId
    ) private returns (bytes memory newCtx) {
        Bid storage bid = outstandingBid[licenseId];
        bid.timestamp = block.timestamp;
        bid.bidder = bidder;
        bid.contributionRate = bidContributionRate;
        bid.perSecondFeeNumerator = accountant.perSecondFeeNumerator();
        bid.perSecondFeeDenominator = accountant.perSecondFeeDenominator();

        newCtx = _increaseAppToUserFlow(_ctx, bidder, bidContributionRate);

        // Collect deposit
        uint256 depositAmount = calculatePurchasePrice(licenseId);
        bool success = acceptedToken.transferFrom(
            bidder,
            address(this),
            depositAmount
        );
        require(success, "AuctionSuperApp: Bid deposit failed");
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
        ISuperToken _superToken,
        address _agreementClass,
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
            (address _sender, address _receiver) = abi.decode(
                _agreementData,
                (address, address)
            );
            isUserToApp = _receiver == address(this);
            user = isUserToApp ? _sender : _receiver;
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
            "CollectorSuperApp: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(
            _isSameToken(superToken),
            "CollectorSuperApp: not accepted token"
        );
        require(
            _isCFAv1(agreementClass),
            "CollectorSuperApp: only CFAv1 supported"
        );
        _;
    }
}
