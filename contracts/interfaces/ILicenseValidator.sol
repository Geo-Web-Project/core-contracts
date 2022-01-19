// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

interface ILicenseValidator {
    function isValid(uint256 id) external view returns (bool);
}
