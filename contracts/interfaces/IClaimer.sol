// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IClaimer {
    function claim(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    ) external;

    function claimPrice(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    ) external view returns (uint256);
}
