// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./IGeoWebParcel.sol";
import "./IPCOLicenseClaimer.sol";
import "./IPCOERC721.sol";
import "./IPCOLicenseParamsStore.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";
import {IDiamondWritable} from "@solidstate/contracts/proxy/diamond/writable/IDiamondWritable.sol";

// solhint-disable-next-line no-empty-blocks
interface IRegistryDiamond is
    IGeoWebParcel,
    IPCOLicenseClaimer,
    IPCOERC721,
    IPCOLicenseParamsStore,
    IDiamondReadable,
    IDiamondWritable
{

}
