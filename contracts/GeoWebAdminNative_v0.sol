// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./GeoWebAdmin_v0.sol";

contract GeoWebAdminNative_v0 is GeoWebAdmin_v0 {
    using SafeMath for uint256;

    mapping(address => uint256) public pendingWithdrawals;

    function claim(
        address _to,
        uint64 baseCoordinate,
        uint256[] calldata path,
        uint256 initialValue,
        string calldata ceramicDocId
    ) external payable {
        _claim(
            _to,
            baseCoordinate,
            path,
            initialValue,
            msg.value,
            ceramicDocId
        );
    }

    function updateValue(uint256 licenseId, uint256 newValue)
        external
        payable
        onlyLicenseHolder(licenseId)
    {
        _updateValue(licenseId, newValue, msg.value);
    }

    function purchaseLicense(
        uint256 licenseId,
        uint256 maxPurchasePrice,
        uint256 newValue,
        string calldata ceramicDocId
    ) external payable {
        uint256 totalBuyPrice = calculateTotalBuyPrice(licenseId);
        require(
            totalBuyPrice <= maxPurchasePrice,
            "Current license for sale price + current fee balance is above max purchase price"
        );
        require(
            msg.value >= totalBuyPrice,
            "Message value must be greater than or equal to the total buy price"
        );

        // Remaining value goes towards fee payment
        _purchaseLicense(
            licenseId,
            totalBuyPrice,
            newValue,
            msg.value.sub(totalBuyPrice),
            ceramicDocId
        );
    }

    function _transferFeePayment(uint256 amount) internal override {
        pendingWithdrawals[owner()] += amount;
    }

    function _transferSellerFeeReimbursement(address seller, uint256 amount)
        internal
        override
    {
        pendingWithdrawals[seller] += amount;
    }

    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
    }
}
