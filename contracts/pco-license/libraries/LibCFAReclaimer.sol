// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "./LibCFABasePCO.sol";

library LibCFAReclaimer {
    using CFAv1Library for CFAv1Library.InitData;
}
