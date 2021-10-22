// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ILicenseValidator.sol";

contract MockLicenseValidator is ILicenseValidator {
    uint256 public truthyValue;

    constructor(uint256 _truthyValue) {
        truthyValue = _truthyValue;
    }

    function isValid(uint256 id) external view override returns (bool) {
        return id == truthyValue;
    }
}
