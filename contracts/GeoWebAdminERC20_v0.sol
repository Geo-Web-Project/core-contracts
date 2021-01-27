// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./GeoWebAdmin_v0.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GeoWebAdminERC20_v0 is GeoWebAdmin_v0 {
    IERC20 public paymentTokenContract;

    function initialize(
        address paymentTokenContractAddress,
        uint256 _minInitialValue,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator,
        uint256 _dutchAuctionLengthInSeconds
    ) public initializer {
        GeoWebAdmin_v0.initialize(
            _minInitialValue,
            _perSecondFeeNumerator,
            _perSecondFeeDenominator,
            _dutchAuctionLengthInSeconds
        );

        paymentTokenContract = IERC20(paymentTokenContractAddress);
    }

    function claim(
        address _to,
        uint64 baseCoordinate,
        uint256[] calldata path,
        uint256 initialValue,
        uint256 initialFeePayment,
        string calldata ceramicDocId
    ) external {
        _claim(
            _to,
            baseCoordinate,
            path,
            initialValue,
            initialFeePayment,
            ceramicDocId
        );
    }

    function updateValue(
        uint256 licenseId,
        uint256 newValue,
        uint256 additionalFeePayment
    ) external onlyLicenseHolder(licenseId) {
        _updateValue(licenseId, newValue, additionalFeePayment);
    }

    function purchaseLicense(
        uint256 licenseId,
        uint256 maxPurchasePrice,
        uint256 newValue,
        uint256 additionalFeePayment
    ) external {
        uint256 totalBuyPrice = calculateTotalBuyPrice(licenseId);
        require(
            totalBuyPrice <= maxPurchasePrice,
            "Current license for sale price + current fee balance is above max purchase price"
        );

        _purchaseLicense(
            licenseId,
            totalBuyPrice,
            newValue,
            additionalFeePayment
        );
    }

    function _transferFeePayment(uint256 amount) internal override {
        paymentTokenContract.transferFrom(msg.sender, owner(), amount);
    }

    function _transferSellerFeeReimbursement(address seller, uint256 amount)
        internal
        override
    {
        paymentTokenContract.transferFrom(msg.sender, seller, amount);
    }
}
