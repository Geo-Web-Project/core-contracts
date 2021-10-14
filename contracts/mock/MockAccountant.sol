// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockAccountant {
    uint256 public perSecondFeeNumerator;
    uint256 public perSecondFeeDenominator;

    mapping(uint256 => uint256) public contributionRates;
    
    constructor(uint256 _perSecondFeeNumerator, uint256 _perSecondFeeDenominator) {
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
    }

    function setContributionRate(uint256 id, uint256 newRate) external {
        contributionRates[id] = newRate;
    }
}
