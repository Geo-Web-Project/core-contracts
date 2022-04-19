// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AuctionSuperApp.sol";
import "./GeoWebParcel.sol";
import "./ERC721License.sol";
import "./interfaces/IClaimer.sol";

contract Reclaimer is Pausable, AccessControl, IClaimer {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant RECLAIM_ROLE = keccak256("RECLAIM_ROLE");

    /// @notice License
    ERC721License public license;

    /// @notice Auction
    AuctionSuperApp public auctionApp;

    /// @notice when the required bid amount reaches its minimum value.
    uint256 public auctionLength;

    /// @notice Emitted when a parcel is purchased
    event ParcelReclaimed(uint256 indexed licenseId, address indexed to);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
    }

    /**
     * @notice Admin can update the parcel.
     * @param user Address of license owner to be
     * @param initialContributionRate Initial contribution rate of parcel
     * @param claimData Path of parcel to claim and Base coordinate of parcel to claim
     * @custom:requires RECLAIM_ROLE
     */
    function claim(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    )
        external
        override
        onlyRole(RECLAIM_ROLE)
        whenNotPaused
        returns (uint256 licenseId)
    {
        uint256 licenseId = abi.decode(claimData, (uint256));
        address oldOwner = license.ownerOf(licenseId);

        if (oldOwner == address(0x0)) {
            revert("Reclaimer: Cannot reclaim non-existent license");
        }

        license.safeTransferFrom(oldOwner, user, licenseId);

        emit ParcelReclaimed(licenseId, user);
    }

    /**
     * @notice Admin can update the parcel.
     * all params are noops for this contract
     * @param user Address of license owner to be
     * @param initialContributionRate Initial contribution rate of parcel
     * @param claimData Path of parcel to claim and Base coordinate of parcel to claim
     */
    function claimPrice(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    ) external view override returns (uint256) {
        (uint256 originalForSalePrice, uint256 startTime) = abi.decode(
            claimData,
            (uint256, uint256)
        );

        uint256 length = auctionLength;

        require(startTime != 0, "parcel is not for reclamation");

        // recliaim price has decended to 0;
        if (block.timestamp > startTime + length) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 priceDecrease = (originalForSalePrice * timeElapsed) / length;
        return originalForSalePrice - priceDecrease;
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
     * @notice Admin can update the auctionApp.
     * @param _superAppAddress The parent SuperFluid Super App address
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setSuperApp(address _superAppAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        auctionApp = AuctionSuperApp(_superAppAddress);
    }

    /**
     * @notice Admin can update the license.
     * @param _licenseAddress The new license used to find owners
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setLicense(address _licenseAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        license = ERC721License(_licenseAddress);
    }

    /**
     * @notice Admin can update the end time of the reclaimer auction.
     * @param _auctionLength The new length of the decending reclaimer auction
     * @custom:requires DEFAULT_ADMIN_ROLE
     */
    function setAuctionLength(uint256 _auctionLength)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        auctionLength = _auctionLength;
    }
}
