// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../interfaces/ILicenseValidator.sol";

contract MockLicenseValidator is ILicenseValidator {
    uint256 public truthyValue;
    uint256 defaultStartDate;

    constructor(uint256 _truthyValue, uint256 _defaultStartDate) {
        truthyValue = _truthyValue;
        defaultStartDate = _defaultStartDate;
    }

    function isValid(uint256 id) external view override returns (bool) {
        return id == truthyValue;
    }
}
