// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockCollector {
    mapping(uint256 => uint256) public licenseExpirationTimestamps;

    uint256 defaultExpiration;
    uint256 minPayment;

    constructor(uint256 _defaultExpiration, uint256 _minPayment) {
        defaultExpiration = _defaultExpiration;
        minPayment = _minPayment;
    }

    function setContributionRate(uint256 id, uint256) external payable {
        require(
            msg.value >= minPayment,
            "Value must be greater than minPayment"
        );
        licenseExpirationTimestamps[id] = block.timestamp + defaultExpiration;
    }
}
