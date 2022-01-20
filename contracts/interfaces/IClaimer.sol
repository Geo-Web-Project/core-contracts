// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IClaimer {
    function claim(
        address user,
        uint256 initialContributionRate,
        bytes calldata claimData
    ) external;
}
