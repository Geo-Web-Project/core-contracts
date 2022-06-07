// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./AuctionSuperApp.sol";
import "./GeoWebParcel.sol";
import "./ERC721License.sol";
import "./interfaces/IClaimer.sol";

contract FairLaunchClaimer is
  Initializable,
  PausableUpgradeable,
  AccessControlUpgradeable,
  IClaimer
{
  bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
  bytes32 public constant CLAIM_ROLE = keccak256("CLAIM_ROLE");

  /// @notice License
  ERC721License public license;

  /// @notice Parcel
  GeoWebParcel public parcel;

  /// @notice start time of the genesis land parcel auction.
  uint256 public auctionStart;
  /// @notice when the required bid amount reaches its minimum value.
  uint256 public auctionEnd;
  /// @notice start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
  uint256 public startingBid;
  /// @notice the final/minimum required bid reached and maintained at the end of the auction.
  uint256 public endingBid;

  /// @notice Emitted when a parcel is purchased
  event ParcelClaimed(uint256 indexed parcelId, address indexed to);

  function initialize() public initializer {
    __AccessControl_init();
    __Pausable_init();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(PAUSE_ROLE, msg.sender);
  }

  /**
   * @notice Admin can update the parcel.
   * @param user Address of license owner to be
   * @param initialContributionRate Initial contribution rate of parcel
   * @param claimData Path of parcel to claim and Base coordinate of parcel to claim
   * @custom:requires CLAIM_ROLE
   */
  function claim(
    address user,
    int96 initialContributionRate,
    bytes calldata claimData
  )
    external
    override
    onlyRole(CLAIM_ROLE)
    whenNotPaused
    returns (uint256 licenseId)
  {
    require(block.timestamp > auctionStart, "auction has not started yet");

    (uint64 baseCoordinate, uint256[] memory path) = abi.decode(
      claimData,
      (uint64, uint256[])
    );

    /// the licenseId is the same as the parcelId returned from parcel.build()
    licenseId = parcel.build(baseCoordinate, path);
    license.safeMint(user, licenseId);
    emit ParcelClaimed(licenseId, user);

    return licenseId;
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
    return _requiredBid();
  }

  /**
   * @notice the current dutch auction price of a parcel.
   */
  function _requiredBid() internal view returns (uint256) {
    if (block.timestamp > auctionEnd) {
      return endingBid;
    }

    uint256 timeElapsed = block.timestamp - auctionStart;
    uint256 auctionDuration = auctionEnd - auctionStart;
    uint256 priceDecrease = (startingBid * timeElapsed) / auctionDuration;
    return startingBid - priceDecrease;
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
   * @notice Admin can update the parcel.
   * @param _parcelAddress The new parcel
   * @custom:requires DEFAULT_ADMIN_ROLE
   */
  function setParcel(address _parcelAddress)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    parcel = GeoWebParcel(_parcelAddress);
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
   * @notice Admin can update the starting bid.
   * @param _startingBid The new starting bid
   * @custom:requires DEFAULT_ADMIN_ROLE
   */
  function setStartingBid(uint256 _startingBid)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    startingBid = _startingBid;
  }

  /**
   * @notice Admin can update the ending bid.
   * @param _endingBid The new ending bid
   * @custom:requires DEFAULT_ADMIN_ROLE
   */
  function setEndingBid(uint256 _endingBid)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    endingBid = _endingBid;
  }

  /**
   * @notice Admin can update the start time of the initial Dutch auction.
   * @param _auctionStart The new start time of the initial Dutch auction
   * @custom:requires DEFAULT_ADMIN_ROLE
   */
  function setAuctionStart(uint256 _auctionStart)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    auctionStart = _auctionStart;
  }

  /**
   * @notice Admin can update the end time of the initial Dutch auction.
   * @param _auctionEnd The new end time of the initial Dutch auction
   * @custom:requires DEFAULT_ADMIN_ROLE
   */
  function setAuctionEnd(uint256 _auctionEnd)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    auctionEnd = _auctionEnd;
  }
}
