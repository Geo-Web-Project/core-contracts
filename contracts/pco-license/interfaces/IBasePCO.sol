// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBasePCO {
    /// @notice Emitted when for sale price is updated
    event PayerForSalePriceUpdated(
        address indexed _payer,
        uint256 forSalePrice
    );

    /// @notice Current payer of license
    function payer() external view returns (address);

    /// @notice Current for sale price of license
    function forSalePrice() external view returns (uint256);
}
