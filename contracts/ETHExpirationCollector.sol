// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ILicenseValidator.sol";
import "./Accountant.sol";

/// @title A smart contract that collects contributions in ETH and stores expiration timestamps to determine balances.
contract ETHExpirationCollector is
    AccessControlEnumerable,
    ILicenseValidator,
    PullPayment,
    Pausable
{
    bytes32 public constant MODIFY_CONTRIBUTION_ROLE =
        keccak256("MODIFY_CONTRIBUTION_ROLE");
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

    /**
     * @notice Admin can update the minContributionRate.
     * @param _minContributionRate The new minimum contribute rate for a license
     * @custom:requires DEFAULT_ADMIN_ROLE
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
     * @custom:requires DEFAULT_ADMIN_ROLE
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
     * @custom:requires DEFAULT_ADMIN_ROLE
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
     * @custom:requires DEFAULT_ADMIN_ROLE
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
     * @custom:requires DEFAULT_ADMIN_ROLE
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
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setAccountant(address accountantAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        accountant = Accountant(accountantAddress);
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
     * @notice Make a contribution payment for a license.
     * @param id The license to make a payment for
     */
    function makePayment(uint256 id) external payable whenNotPaused {
        uint256 currentContributionRate = accountant.contributionRates(id);

        // Update expiration
        _updateExpiration(id, currentContributionRate, msg.value);

        // Transfer payment to receiver
        _asyncTransfer(receiver, msg.value);

        emit PaymentMade(id, msg.value);
    }

    /**
     * @notice Set the contribution rate for a license and optionally make a payment
     * @param id The license to make a payment for
     * @param newContributionRate The new contribution rate for the license
     * @custom:requires MODIFY_CONTRIBUTION_ROLE or sender is license owner
     */
    function setContributionRate(uint256 id, uint256 newContributionRate)
        external
        payable
        whenNotPaused
    {
        require(
            hasRole(MODIFY_CONTRIBUTION_ROLE, msg.sender) ||
                license.ownerOf(id) == msg.sender,
            "Caller does not have permission"
        );
        require(
            newContributionRate >= minContributionRate,
            "Contribution rate must be greater than minimum"
        );

        // Update expiration
        _updateExpiration(id, newContributionRate, msg.value);

        // Update contribution rate in Accountant
        accountant.setContributionRate(id, newContributionRate);
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
     * @notice Get the date at which the license will become valid
     * @param id The id of the license
     * @return Timestamp of when license will begin to be invalid
     */
    function invalidStartDate(uint256 id)
        external
        view
        override
        returns (uint256)
    {
        return licenseExpirationTimestamps[id];
    }

    /**
     * @dev Updates expiration for a license
     * @param id The id of the license
     * @param newContributionRate The new contribution rate for the license
     * @param additionalContribution The additional contribution amount
     */
    function _updateExpiration(
        uint256 id,
        uint256 newContributionRate,
        uint256 additionalContribution
    ) internal {
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
        uint256 existingNetworkFeeBalance = existingTimeBalance *
            currentContributionRate;

        // Calculate new network fee balance
        uint256 newNetworkFeeBalance = existingNetworkFeeBalance +
            additionalContribution;

        // Calculate new time balance
        uint256 newTimeBalance = newNetworkFeeBalance / newContributionRate;

        require(newTimeBalance > 0, "New time balance must be greater than 0");

        // Calculate new expiration
        uint256 newExpirationTimestamp = newTimeBalance + block.timestamp;

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
}
