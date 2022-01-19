// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/payment/PullPayment.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILicenseValidator.sol";
import "./Accountant.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title A smart contract that collects contributions in ETH and stores expiration timestamps to determine balances.
contract ETHExpirationCollector is
    AccessControl,
    ILicenseValidator,
    PullPayment,
    Pausable
{
    bytes32 public constant MODIFY_CONTRIBUTION_ROLE =
        keccak256("MODIFY_CONTRIBUTION_ROLE");
    bytes32 public constant MODIFY_FUNDS_ROLE = keccak256("MODIFY_FUNDS_ROLE");
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    /// @notice Minimum contribution rate for a license.
    uint256 public minContributionRate;
    /// @notice Minimum expiration for a license.
    uint256 public minExpiration;
    /// @notice Maximum expiration for a license.
    uint256 public maxExpiration;
    /// @notice ERC721 License used to find owners.
    IERC721 public license;
    /// @notice Receiver of contributions.
    address public receiver;
    /// @notice Accountant.
    Accountant public accountant;

    /// @notice Stores the expiration timestamp for each license
    mapping(uint256 => uint256) public licenseExpirationTimestamps;

    /// @notice Emitted when an expiration is updated
    event LicenseExpirationUpdated(
        uint256 indexed licenseId,
        uint256 newExpirationTimestamp
    );

    /// @notice Emitted when a payment is made
    event PaymentMade(uint256 indexed licenseId, uint256 paymentAmount);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
    }

    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, _msgSender())) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(uint160(_msgSender()), 20),
                        " is missing role ",
                        Strings.toHexString(uint256(role), 32)
                    )
                )
            );
        }
        _;
    }

    /**
     * @notice Admin can update the minContributionRate.
     * @param _minContributionRate The new minimum contribute rate for a license
     */
    function setMinContributionRate(uint256 _minContributionRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        minContributionRate = _minContributionRate;
    }

    /**
     * @notice Admin can update the minExpiration.
     * @param _minExpiration The new minimum expiration for a license
     */
    function setMinExpiration(uint256 _minExpiration)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        minExpiration = _minExpiration;
    }

    /**
     * @notice Admin can update the maxExpiration.
     * @param _maxExpiration The new maximun expiration for a license
     */
    function setMaxExpiration(uint256 _maxExpiration)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        maxExpiration = _maxExpiration;
    }

    /**
     * @notice Admin can update the license.
     * @param licenseAddress The new license used to find owners
     */
    function setLicense(address licenseAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        license = IERC721(licenseAddress);
    }

    /**
     * @notice Admin can update the receiver.
     * @param _receiver The new receiver of contributions
     */
    function setReceiver(address _receiver)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        receiver = _receiver;
    }

    /**
     * @notice Admin can update the accountant.
     * @param accountantAddress The new accountant
     */
    function setAccountant(address accountantAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        accountant = Accountant(accountantAddress);
    }

    /**
     * @notice Pause the contract. Pauses payments and setting contribution rates.
     */
    function pause() external onlyRole(PAUSE_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     */
    function unpause() external onlyRole(PAUSE_ROLE) {
        _unpause();
    }

    /**
     * @notice Make a contribution payment for a license.
     * @param id The license to make a payment for
     */
    function makePayment(uint256 id) external payable whenNotPaused {
        uint256 currentContributionRate = accountant.contributionRates(id);

        // Update expiration
        _updateExpiration(id, currentContributionRate, msg.value, 0);

        // Transfer payment to receiver
        _asyncTransfer(receiver, msg.value);

        emit PaymentMade(id, msg.value);
    }

    /**
     * @notice Set the contribution rate for a license and optionally make a payment
     * @param id The license to make a payment for
     * @param newContributionRate The new contribution rate for the license
     */
    function setContributionRate(uint256 id, uint256 newContributionRate)
        external
        payable
        whenNotPaused
    {
        require(
            hasRole(MODIFY_CONTRIBUTION_ROLE, msg.sender) ||
                license.ownerOf(id) == msg.sender ||
                license.isApprovedForAll(license.ownerOf(id), msg.sender) ||
                license.getApproved(id) == msg.sender,
            "Caller does not have permission"
        );
        require(
            newContributionRate >= minContributionRate,
            "Contribution rate must be greater than minimum"
        );

        // Update expiration
        _updateExpiration(id, newContributionRate, msg.value, 0);

        // Update contribution rate in Accountant
        accountant.setContributionRate(id, newContributionRate);
    }

    /**
     * @notice Migrate all funds from one license to another and clear the from license
     * @param fromId The license to migrate from and clear
     * @param toId The license to migrate to
     */
    function migrateFunds(
        uint256 fromId,
        uint256 toId,
        uint256 toContributionRate
    ) external payable onlyRole(MODIFY_FUNDS_ROLE) {
        require(
            toContributionRate >= minContributionRate,
            "Contribution rate must be greater than minimum"
        );

        uint256 fromNetworkFeeBalance = _calculateNetworkFeeBalance(fromId);
        _updateExpiration(
            toId,
            toContributionRate,
            fromNetworkFeeBalance + msg.value,
            0
        );

        // Clear from license
        licenseExpirationTimestamps[fromId] = 0;
        accountant.setContributionRate(fromId, 0);

        // Update contribution rate in Accountant
        accountant.setContributionRate(toId, toContributionRate);
    }

    /**
     * @notice Move funds from one license to another
     * @param fromId The license to move from
     * @param toId The license to move to
     * @param amount The amount of funds to move
     */
    function moveFunds(
        uint256 fromId,
        uint256 fromContributionRate,
        uint256 fromAdditionalPayment,
        uint256 toId,
        uint256 toContributionRate,
        uint256 toAdditionalPayment,
        uint256 amount
    ) external payable onlyRole(MODIFY_FUNDS_ROLE) {
        require(
            fromContributionRate >= minContributionRate,
            "Contribution rate must be greater than minimum"
        );
        require(
            toContributionRate >= minContributionRate,
            "Contribution rate must be greater than minimum"
        );
        require(
            fromAdditionalPayment + toAdditionalPayment == msg.value,
            "Additional payments must be sent"
        );

        uint256 fromNetworkFeeBalance = _calculateNetworkFeeBalance(fromId);
        require(fromNetworkFeeBalance >= amount, "Not enough funds in FROM");

        // Take amount from
        _updateExpiration(
            fromId,
            fromContributionRate,
            fromAdditionalPayment,
            amount
        );

        // Give amount to
        _updateExpiration(
            toId,
            toContributionRate,
            toAdditionalPayment + amount,
            0
        );

        // Update contribution rates in Accountant
        accountant.setContributionRate(fromId, fromContributionRate);
        accountant.setContributionRate(toId, toContributionRate);
    }

    /**
     * @notice Check if a license is valid.
     * @param id The id of the license
     * @return If the license is valid
     */
    function isValid(uint256 id) public view override returns (bool) {
        return licenseExpirationTimestamps[id] > block.timestamp;
    }

    /**
     * @dev Updates expiration for a license
     * @param id The id of the license
     * @param newContributionRate The new contribution rate for the license
     * @param additionalContribution The additional contribution amount
     * @param lessContribution The contribution amount to remove
     */
    function _updateExpiration(
        uint256 id,
        uint256 newContributionRate,
        uint256 additionalContribution,
        uint256 lessContribution
    ) internal {
        uint256 existingNetworkFeeBalance = _calculateNetworkFeeBalance(id);

        // Calculate new network fee balance
        uint256 newNetworkFeeBalance = existingNetworkFeeBalance +
            additionalContribution -
            lessContribution;
        uint256 newExpirationTimestamp = _calculateNewExpiration(
            newNetworkFeeBalance,
            newContributionRate
        );

        require(
            (newExpirationTimestamp - block.timestamp) >= minExpiration,
            "Resulting expiration date must be at least minExpiration"
        );

        // Max expiration
        if ((newExpirationTimestamp - block.timestamp) > maxExpiration) {
            newExpirationTimestamp = block.timestamp + maxExpiration;
        }

        licenseExpirationTimestamps[id] = newExpirationTimestamp;

        emit LicenseExpirationUpdated(id, newExpirationTimestamp);
    }

    function _calculateNetworkFeeBalance(uint256 id)
        internal
        view
        returns (uint256)
    {
        uint256 currentExpirationTimestamp = licenseExpirationTimestamps[id];
        uint256 currentContributionRate = accountant.contributionRates(id);

        // Calculate existing time balance
        uint256 existingTimeBalance;
        if (currentExpirationTimestamp > block.timestamp) {
            existingTimeBalance = currentExpirationTimestamp - block.timestamp;
        } else {
            existingTimeBalance = 0;
        }

        // Calculate existing network fee balance
        return existingTimeBalance * currentContributionRate;
    }

    function _calculateNewExpiration(
        uint256 newNetworkFeeBalance,
        uint256 newContributionRate
    ) internal view returns (uint256) {
        // Calculate new time balance
        uint256 newTimeBalance = newNetworkFeeBalance / newContributionRate;

        require(newTimeBalance > 0, "New time balance must be greater than 0");

        // Calculate new expiration
        return newTimeBalance + block.timestamp;
    }
}
