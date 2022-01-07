// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, ContextDefinitions, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract CollectorSuperApp is SuperAppBase, AccessControlEnumerable {
    bytes32 public constant MODIFY_CONTRIBUTION_ROLE =
        keccak256("MODIFY_CONTRIBUTION_ROLE");

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
    address private _receiver;

    /// @notice Stores the total contribution rate of all licenses for a particular user
    mapping(address => int96) public totalContributionRate;

    /// @notice Stores the locked contribution rate of all pending bids for a particular user
    mapping(address => int96) public lockedContributionRate;

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken,
        address receiver
    ) {
        require(address(host) != address(0), "host is zero address");
        require(address(cfa) != address(0), "cfa is zero address");
        require(
            address(acceptedToken) != address(0),
            "acceptedToken is zero address"
        );
        require(address(receiver) != address(0), "receiver is zero address");
        require(!host.isApp(ISuperApp(receiver)), "receiver is an app");

        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
        _receiver = receiver;

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Create initial flow to receiver
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                _receiver,
                0,
                new bytes(0)
            ),
            "0x"
        );
    }

    /// @dev Calculate the available contribution for a user.
    function calculateAvailableContribution(address user)
        public
        view
        returns (int96)
    {
        (, int96 flowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            user,
            address(this)
        );

        return
            flowRate -
            totalContributionRate[user] -
            lockedContributionRate[user];
    }

    /// @dev Locks contribution without starting. Goes against available contribution.
    function lockContributionRate(address user, int96 amount)
        external
        onlyRole(MODIFY_CONTRIBUTION_ROLE)
    {
        require(
            calculateAvailableContribution(user) >= amount,
            "CollectorSuperApp: Not enough contribution available to lock"
        );

        lockedContributionRate[user] += amount;
    }

    /// @dev Unlocks contribution that was previously locked.
    function unlockContributionRate(address user, int96 amount)
        external
        onlyRole(MODIFY_CONTRIBUTION_ROLE)
    {
        require(
            lockedContributionRate[user] >= amount,
            "CollectorSuperApp: Not enough contribution available to unlock"
        );

        lockedContributionRate[user] -= amount;
    }

    /// @dev Increase contribution rate of user
    function increaseContributionRate(address user, int96 amount)
        external
        onlyRole(MODIFY_CONTRIBUTION_ROLE)
    {
        require(
            calculateAvailableContribution(user) >= amount,
            "CollectorSuperApp: Not enough contribution available to contribute"
        );

        totalContributionRate[user] += amount;

        // Update Flow(app -> user)
        _decreaseAppToUserFlow(user, amount);

        // Update Flow(app -> receiver)
        _increaseAppToReceiverFlow(amount);
    }

    /// @dev Decrease contribution rate of user
    function decreaseContributionRate(address user, int96 amount)
        external
        onlyRole(MODIFY_CONTRIBUTION_ROLE)
    {
        require(
            totalContributionRate[user] >= amount,
            "CollectorSuperApp: Not enough contribution available to decrease"
        );

        totalContributionRate[user] -= amount;

        // Update Flow(app -> user)
        _increaseAppToUserFlow(user, amount);

        // Update Flow(app -> receiver)
        _decreaseAppToReceiverFlow(amount);
    }

    function _increaseAppToReceiverFlow(int96 amount) private {
        (, int96 flowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            _receiver
        );
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                _receiver,
                flowRate + amount,
                new bytes(0)
            ),
            "0x"
        );
    }

    function _decreaseAppToReceiverFlow(int96 amount) private {
        (, int96 flowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            _receiver
        );
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                _receiver,
                flowRate - amount,
                new bytes(0)
            ),
            "0x"
        );
    }

    function _increaseAppToUserFlow(address user, int96 amount) private {
        (, int96 flowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            user
        );
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                user,
                flowRate + amount,
                new bytes(0)
            ),
            "0x"
        );
    }

    function _decreaseAppToUserFlow(address user, int96 amount) private {
        (, int96 flowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            user
        );
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                user,
                flowRate - amount,
                new bytes(0)
            ),
            "0x"
        );
    }

    /// @dev Update back flow to user
    function _updateBackflow(
        bytes calldata ctx,
        bytes32 agreementId,
        bytes calldata _agreementData,
        bytes4 selector
    ) private returns (bytes memory newCtx) {
        newCtx = ctx;
        (address user, ) = abi.decode(_agreementData, (address, address));
        (, int96 flowRate, , ) = _cfa.getFlowByID(_acceptedToken, agreementId);

        require(
            flowRate >= totalContributionRate[user],
            "CollectorSuperApp: Flow cannot be less than totalContributionRate[user]"
        );

        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                selector,
                _acceptedToken,
                user,
                flowRate - totalContributionRate[user],
                new bytes(0)
            ),
            "0x",
            newCtx
        );
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
        returns (bytes memory newCtx)
    {
        return
            _updateBackflow(
                _ctx,
                _agreementId,
                _agreementData,
                _cfa.createFlow.selector
            );
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata, //_cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return
            _updateBackflow(
                _ctx,
                _agreementId,
                _agreementData,
                _cfa.updateFlow.selector
            );
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, //_agreementId,
        bytes calldata _agreementData,
        bytes calldata, //_cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;

        newCtx = _ctx;
        (address user, ) = abi.decode(_agreementData, (address, address));

        // Delete Flow(app -> user)
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                address(this),
                user,
                new bytes(0)
            ),
            "0x",
            newCtx
        );

        // Decrease Flow(app -> receiver)
        (, int96 appFlowRate, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            _receiver
        );
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                _receiver,
                appFlowRate - totalContributionRate[user],
                new bytes(0)
            ),
            "0x",
            newCtx
        );

        totalContributionRate[user] = 0;
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
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
            msg.sender == address(_host),
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
