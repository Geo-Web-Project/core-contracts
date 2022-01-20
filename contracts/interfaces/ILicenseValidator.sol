// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILicenseValidator {
    function isValid(uint256 id) external view returns (bool);
}
