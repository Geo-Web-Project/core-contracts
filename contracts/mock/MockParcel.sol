// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockParcel {
    uint256 nextId = 0;

    function build(uint64 baseCoordinate, uint256[] calldata path)
        external
        returns (uint256 newParcelId)
    {
        newParcelId = nextId;
        nextId = nextId + 1;
    }
}
