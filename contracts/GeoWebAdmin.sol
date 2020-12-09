// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ERC721License.sol";
import "./GeoWebParcel.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GeoWebAdmin is Ownable {
    using SafeMath for uint256;

    ERC721License public licenseContract;
    GeoWebParcel public parcelContract;
    IERC20 public paymentTokenContract;

    uint256 public minInitialValue;
    uint256 public perSecondFeeNumerator;
    uint256 public perSecondFeeDenominator;

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

    constructor(
        address paymentTokenContractAddress,
        uint256 _minInitialValue,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) public {
        paymentTokenContract = IERC20(paymentTokenContractAddress);
        minInitialValue = _minInitialValue;
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
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

    function claim(
        address _to,
        uint64 baseCoordinate,
        uint256[] calldata path,
        uint256 initialValue,
        uint256 initialFeePayment
    ) external {
        require(
            initialValue >= minInitialValue,
            "Initial value must be >= the required minimum value"
        );

        // Check expiration date
        uint256 perSecondFee = initialValue.mul(perSecondFeeNumerator).div(
            perSecondFeeDenominator
        );
        uint256 expirationTimestamp = initialFeePayment.div(perSecondFee).add(
            now
        );

        require(
            expirationTimestamp.sub(now) >= 365 days,
            "Resulting expiration date must be at least 365 days"
        );
        require(
            expirationTimestamp.sub(now) <= 730 days,
            "Resulting expiration date must be less than or equal to 730 days"
        );

        // Transfer initial payment
        paymentTokenContract.transferFrom(
            msg.sender,
            owner(),
            initialFeePayment
        );

        // Mint parcel and license
        uint256 newParcelId = parcelContract.mintLandParcel(
            baseCoordinate,
            path
        );
        licenseContract.mintLicense(_to, newParcelId);

        // Save license info
        LicenseInfo storage l = licenseInfo[newParcelId];
        l.value = initialValue;
        l.expirationTimestamp = expirationTimestamp;

        emit LicenseInfoUpdated(newParcelId, initialValue, expirationTimestamp);
    }

    function updateValue(
        uint256 licenseId,
        uint256 newValue,
        uint256 additionalFeePayment
    ) external onlyLicenseHolder(licenseId) {
        require(
            newValue >= minInitialValue,
            "New value must be >= the required minimum value"
        );

        LicenseInfo storage license = licenseInfo[licenseId];

        // Update expiration date
        uint256 existingTimeBalance = license.expirationTimestamp.sub(now);
        uint256 newTimeBalance = existingTimeBalance.mul(license.value).div(
            newValue
        );

        uint256 newExpirationTimestamp = newTimeBalance.add(now);

        require(
            newExpirationTimestamp.sub(now) >= 14 days,
            "Resulting expiration date must be at least 14 days"
        );

        // Max expiration of 2 years
        if (newExpirationTimestamp.sub(now) > 730 days) {
            newExpirationTimestamp = now.add(730 days);
        }

        // Transfer payment
        paymentTokenContract.transferFrom(
            msg.sender,
            owner(),
            additionalFeePayment
        );

        // Save license info
        license.value = newValue;
        license.expirationTimestamp = newExpirationTimestamp;

        emit LicenseInfoUpdated(licenseId, newValue, newExpirationTimestamp);
    }
}
