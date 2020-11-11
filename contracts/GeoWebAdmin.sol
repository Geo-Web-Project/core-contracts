// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ERC721License.sol";
import "./GeoWebParcel.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GeoWebAdmin is Ownable {
    using SafeMath for uint256;

    ERC721License licenseContract;
    GeoWebParcel parcelContract;
    IERC20 unitTokenContract;

    uint256 _minInitialValue;
    uint256 _perSecondFeeNumerator;
    uint256 _perSecondFeeDenominator;

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

    constructor(
        address unitTokenContractAddress,
        uint256 minInitialValue,
        uint256 perSecondFeeNumerator,
        uint256 perSecondFeeDenominator
    ) public {
        unitTokenContract = IERC20(unitTokenContractAddress);
        _minInitialValue = minInitialValue;
        _perSecondFeeNumerator = perSecondFeeNumerator;
        _perSecondFeeDenominator = perSecondFeeDenominator;
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
            initialValue >= _minInitialValue,
            "Initial value must be >= the required minimum value"
        );

        // Check expiration date
        uint256 perSecondFee = initialValue.mul(_perSecondFeeNumerator).div(
            _perSecondFeeDenominator
        );
        uint256 expirationTimestamp = initialFeePayment.div(perSecondFee).add(
            now
        );
        require(
            expirationTimestamp.sub(now) >= 365 days,
            "Resulting expiration date must be at least 365 days"
        );
        require(
            expirationTimestamp.sub(now) < 730 days,
            "Resulting expiration date must be less than 730 days"
        );

        // Transfer initial payment
        unitTokenContract.transferFrom(msg.sender, owner(), initialFeePayment);

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
}
