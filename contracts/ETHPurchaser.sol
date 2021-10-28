// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ETHExpirationCollector.sol";
import "./ERC721License.sol";
import "./Accountant.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";

/// @title A smart contract that enables the sale and transfer of always-for-sale licenses in ETH.
contract ETHPurchaser is AccessControlEnumerable, Pausable, PullPayment {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    /// @notice ETHExpirationCollector
    ETHExpirationCollector public collector;

    /// @notice License
    ERC721License public license;

    /// @notice Accountant
    Accountant public accountant;

    /// @notice Length of Dutch auction upon a parcel becoming invalid.
    uint256 public dutchAuctionLengthInSeconds;

    /// @notice Emitted when a parcel is purchased
    event ParcelPurchased(
        uint256 indexed parcelId,
        address indexed from,
        address indexed to
    );

    constructor(
        uint256 _dutchAuctionLengthInSeconds,
        address licenseAddress,
        address collectorAddress,
        address accountantAddress
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);

        dutchAuctionLengthInSeconds = _dutchAuctionLengthInSeconds;
        license = ERC721License(licenseAddress);
        collector = ETHExpirationCollector(collectorAddress);
        accountant = Accountant(accountantAddress);
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
        license = ERC721License(licenseAddress);
    }

    /**
     * @notice Admin can update the collector.
     * @param collectorAddress The new collector
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setCollector(address collectorAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        collector = ETHExpirationCollector(collectorAddress);
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
     * @notice Admin can update the dutch auction length.
     * @param _dutchAuctionLengthInSeconds The new dutch auction length
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setDutchAuctionLengthInSeconds(
        uint256 _dutchAuctionLengthInSeconds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dutchAuctionLengthInSeconds = _dutchAuctionLengthInSeconds;
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

        uint256 expirationTimestamp = collector.licenseExpirationTimestamps(id);

        if (expirationTimestamp > block.timestamp) {
            // Calculate outstanding fee balance
            uint256 existingTimeBalance = expirationTimestamp - block.timestamp;
            uint256 feeBalance = existingTimeBalance * contributionRate;

            return value + feeBalance;
        } else if (
            block.timestamp >=
            (expirationTimestamp + dutchAuctionLengthInSeconds)
        ) {
            return 0;
        } else {
            uint256 auctionTime = block.timestamp - expirationTimestamp;
            uint256 dutchAuctionDecrease = (value * auctionTime) /
                dutchAuctionLengthInSeconds;

            return value - dutchAuctionDecrease;
        }
    }

    /**
     * @notice Purchase an existing parcel and set a new contribution rate.
     * @param id Parcel id to purchase
     * @param to Address of license owner to be
     * @param maxPurchasePrice Max purchase price willing to pay for parcel
     * @param newContributionRate New contribution rate of parcel
     */
    function purchase(
        uint256 id,
        address to,
        uint256 maxPurchasePrice,
        uint256 newContributionRate
    ) public payable whenNotPaused {
        uint256 purchasePrice = calculatePurchasePrice(id);
        require(
            purchasePrice <= maxPurchasePrice,
            "Current license for sale price + current fee balance is above max purchase price"
        );
        require(
            msg.value >= purchasePrice,
            "Message value must be greater than or equal to the total buy price"
        );

        // Transfer payment to current owner
        address currentOwner = license.ownerOf(id);
        _asyncTransfer(currentOwner, purchasePrice);

        // Update contribution rate
        uint256 remainingPayment = msg.value - purchasePrice;
        collector.setContributionRate{value: remainingPayment}(
            id,
            newContributionRate
        );

        // Transfer license last to avoid reentry
        emit ParcelPurchased(id, currentOwner, to);

        license.safeTransferFrom(currentOwner, to, id);
    }
}
