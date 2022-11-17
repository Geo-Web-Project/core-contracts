// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./ICFABasePCO.sol";
import "./ICFAPenaltyBid.sol";
import "./ICFAReclaimer.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";
import {IDiamondWritable} from "@solidstate/contracts/proxy/diamond/writable/IDiamondWritable.sol";

// solhint-disable-next-line no-empty-blocks
interface IPCOLicenseDiamond is
    ICFABasePCO,
    ICFAPenaltyBid,
    ICFAReclaimer,
    IDiamondReadable,
    IDiamondWritable
{

}
