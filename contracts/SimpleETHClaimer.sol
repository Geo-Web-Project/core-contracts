// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ETHExpirationCollector.sol";
import "./ERC721License.sol";
import "./mock/MockParcel.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

/// @title A smart contract that enables simple, first-come-first-serve claims on land parcels.
contract SimpleETHClaimer is AccessControlEnumerable, Pausable {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    /// @notice ETHExpirationCollector
    ETHExpirationCollector public collector;

    /// @notice License
    ERC721License public license;

    /// @notice Parcel
    MockParcel public parcel;

    /// @notice Minimum initial expiration for a license.
    uint256 public minClaimExpiration;

    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed parcelId, address indexed owner);

    constructor(
        uint256 _minClaimExpiration,
        address licenseAddress,
        address collectorAddress,
        address parcelAddress
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);

        minClaimExpiration = _minClaimExpiration;

        license = ERC721License(licenseAddress);
        parcel = MockParcel(parcelAddress);
        collector = ETHExpirationCollector(collectorAddress);
    }

    /**
     * @notice Admin can update the minClaimExpiration.
     * @param _minClaimExpiration The new minimum initial expiration for a license
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setMinClaimExpiration(uint256 _minClaimExpiration)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        minClaimExpiration = _minClaimExpiration;
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
     * @notice Admin can update the parcel.
     * @param parcelAddress The new parcel
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setParcel(address parcelAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        parcel = MockParcel(parcelAddress);
    }

    /**
     * @notice Claim a new parcel with an initial contribution payment.
     * @param to Address of license owner to be
     * @param baseCoordinate Base coordinate of parcel to claim
     * @param path Path of parcel to claim
     * @param initialContributionRate Initial contribution rate of parcel
     */
    function claim(
        address to,
        uint64 baseCoordinate,
        uint256[] calldata path,
        uint256 initialContributionRate
    ) external payable whenNotPaused {
        // Build parcel
        uint256 parcelId = parcel.build(baseCoordinate, path);

        // Collect initial payment and set contribution rate
        collector.setContributionRate{value: msg.value}(
            parcelId,
            initialContributionRate
        );

        uint256 expirationTimestamp = collector.licenseExpirationTimestamps(
            parcelId
        );

        require(
            (expirationTimestamp - block.timestamp) >= minClaimExpiration,
            "Resulting expiration date must be at least minClaimExpiration"
        );

        emit ParcelClaimed(parcelId, to);

        // Mint license last to avoid reentry
        license.safeMint(to, parcelId);
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
}
