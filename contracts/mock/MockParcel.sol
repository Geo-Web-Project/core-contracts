// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockParcel {
    uint256 public nextId = 0;

    function build(uint64, uint256[] calldata)
        external
        returns (uint256 newParcelId)
    {
        newParcelId = nextId;
        nextId = nextId + 1;
    }
}
