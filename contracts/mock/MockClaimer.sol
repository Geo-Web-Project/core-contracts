// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IClaimer.sol";

contract MockClaimer is IClaimer {
    uint256 public claimCallCount = 0;

    function claim(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    ) external override {
        claimCallCount += 1;
    }

    function claimPrice(
        address user,
        int96 initialContributionRate,
        bytes calldata claimData
    ) external view override returns (uint256) {
        return 100;
    }
}
