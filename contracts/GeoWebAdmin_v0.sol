// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ERC721License.sol";
import "./GeoWebParcel.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

abstract contract GeoWebAdmin_v0 is Initializable, OwnableUpgradeable {
    using SafeMath for uint256;

    ERC721License public licenseContract;
    GeoWebParcel public parcelContract;

    uint256 public minInitialValue;
    uint256 public minClaimExpiration;
    uint256 public minExpiration;
    uint256 public maxExpiration;
    uint256 public perSecondFeeNumerator;
    uint256 public perSecondFeeDenominator;
    uint256 public dutchAuctionLengthInSeconds;

    /// @notice licenseInfo stores admin information about licenses
    mapping(uint256 => LicenseInfo) public licenseInfo;

    struct LicenseInfo {
        uint256 value;
        uint256 expirationTimestamp;
    }

    event LicenseInfoUpdated(
        uint256 indexed _licenseId,
        uint256 value,
        uint256 expirationTimestamp
    );

    modifier onlyLicenseHolder(uint256 licenseId) {
        require(
            msg.sender == licenseContract.ownerOf(licenseId),
            "Only holder of license can call this function."
        );
        _;
    }

    function initialize(
        uint256 _minInitialValue,
        uint256 _minClaimExpiration,
        uint256 _minExpiration,
        uint256 _maxExpiration,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator,
        uint256 _dutchAuctionLengthInSeconds
    ) public initializer {
        __Ownable_init();

        minInitialValue = _minInitialValue;
        minClaimExpiration = _minClaimExpiration;
        minExpiration = _minExpiration;
        maxExpiration = _maxExpiration;
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
        dutchAuctionLengthInSeconds = _dutchAuctionLengthInSeconds;
    }

    function setMinInitialValue(uint256 _minInitialValue) external onlyOwner {
        minInitialValue = _minInitialValue;
    }

    function setParcelContract(address parcelContractAddress)
        external
        onlyOwner
    {
        parcelContract = GeoWebParcel(parcelContractAddress);
    }

    function setLicenseContract(address licenseContractAddress)
        external
        onlyOwner
    {
        licenseContract = ERC721License(licenseContractAddress);
    }

    function setDutchAuctionLength(uint256 _dutchAuctionLengthInSeconds)
        external
        onlyOwner
    {
        dutchAuctionLengthInSeconds = _dutchAuctionLengthInSeconds;
    }

    function _claim(
        address _to,
        uint64 baseCoordinate,
        uint256[] memory path,
        uint256 initialValue,
        uint256 initialFeePayment
    ) internal {
        require(
            initialValue >= minInitialValue,
            "Initial value must be >= the required minimum value"
        );

        // Check expiration date
        uint256 perSecondFee =
            initialValue.mul(perSecondFeeNumerator).div(
                perSecondFeeDenominator
            );
        uint256 expirationTimestamp =
            initialFeePayment.div(perSecondFee).add(now);

        require(
            expirationTimestamp.sub(now) >= minClaimExpiration,
            "Resulting expiration date must be at least minClaimExpiration"
        );
        require(
            expirationTimestamp.sub(now) <= maxExpiration,
            "Resulting expiration date must be less than or equal to maxExpiration"
        );

        // Transfer initial payment
        _transferFeePayment(initialFeePayment);

        // Mint parcel and license
        uint256 newParcelId =
            parcelContract.mintLandParcel(baseCoordinate, path);
        licenseContract.mintLicense(_to, newParcelId);

        // Save license info
        LicenseInfo storage l = licenseInfo[newParcelId];
        l.value = initialValue;
        l.expirationTimestamp = expirationTimestamp;

        emit LicenseInfoUpdated(newParcelId, initialValue, expirationTimestamp);
    }

    function _updateValue(
        uint256 licenseId,
        uint256 newValue,
        uint256 additionalFeePayment
    ) internal {
        _updateLicense(licenseId, newValue, additionalFeePayment);
    }

    function _purchaseLicense(
        uint256 licenseId,
        uint256 totalBuyPrice,
        uint256 newValue,
        uint256 additionalFeePayment
    ) internal {
        // Transfer payment to seller
        _transferSellerFeeReimbursement(
            licenseContract.ownerOf(licenseId),
            totalBuyPrice
        );

        // Transfer license to buyer
        licenseContract.transferFrom(
            licenseContract.ownerOf(licenseId),
            msg.sender,
            licenseId
        );

        // Update license info
        _updateLicense(licenseId, newValue, additionalFeePayment);
    }

    function _updateLicense(
        uint256 licenseId,
        uint256 newValue,
        uint256 additionalFeePayment
    ) internal {
        require(
            newValue >= minInitialValue,
            "New value must be >= the required minimum value"
        );

        LicenseInfo storage license = licenseInfo[licenseId];

        // Calculate existing time balance
        uint256 existingTimeBalance;
        if (license.expirationTimestamp > now) {
            existingTimeBalance = license.expirationTimestamp.sub(now);
        } else {
            existingTimeBalance = 0;
        }

        // Calculate existing network fee balance
        uint256 existingNetworkFeeBalance = existingTimeBalance.mul(license.value).mul(perSecondFeeNumerator).div(perSecondFeeDenominator);

        // Calculate new network fee balance
        uint256 newNetworkFeeBalance = existingNetworkFeeBalance.add(additionalFeePayment);

        // Calculate new time balance
        uint256 newTimeBalance =
            newNetworkFeeBalance.div(newValue.mul(perSecondFeeNumerator).div(perSecondFeeDenominator));

        // Calculate new expiration
        uint256 newExpirationTimestamp =
            newTimeBalance.add(now);

        require(
            newExpirationTimestamp.sub(now) >= minExpiration,
            "Resulting expiration date must be at least minExpiration"
        );

        // Max expiration
        if (newExpirationTimestamp.sub(now) > maxExpiration) {
            newExpirationTimestamp = now.add(maxExpiration);
        }

        // Transfer additional payment
        _transferFeePayment(additionalFeePayment);

        // Save license info
        license.value = newValue;
        license.expirationTimestamp = newExpirationTimestamp;

        emit LicenseInfoUpdated(licenseId, newValue, newExpirationTimestamp);
    }

    function calculateTotalBuyPrice(uint256 licenseId)
        public
        view
        returns (uint256)
    {
        LicenseInfo storage license = licenseInfo[licenseId];
        return
            _calculateTotalBuyPrice(
                license.expirationTimestamp,
                license.value,
                now
            );
    }

    function _calculateTotalBuyPrice(
        uint256 expirationTimestamp,
        uint256 value,
        uint256 currentTime
    ) public view returns (uint256) {
        if (expirationTimestamp < currentTime) {
            //  Duction auction price
            uint256 auctionTime = currentTime.sub(expirationTimestamp);

            if (auctionTime > dutchAuctionLengthInSeconds) {
                // Auction is over, parcel is free
                return 0;
            } else {
                uint256 dutchAuctionDecrease =
                    value.mul(auctionTime).div(dutchAuctionLengthInSeconds);
                return value.sub(dutchAuctionDecrease);
            }
        } else {
            // Normal buy price
            uint256 existingTimeBalance = expirationTimestamp.sub(currentTime);
            uint256 perSecondFee =
                value.mul(perSecondFeeNumerator).div(perSecondFeeDenominator);
            uint256 existingFeeBalance = existingTimeBalance.mul(perSecondFee);

            uint256 totalBuyPrice = value.add(existingFeeBalance);

            return totalBuyPrice;
        }
    }

    function _transferFeePayment(uint256 amount) internal virtual;

    function _transferSellerFeeReimbursement(address seller, uint256 amount)
        internal
        virtual;
}
