// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../../libraries/LibCFABasePCO.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

contract TestableCFABasePCOFacet {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    function manualTransfer(address to, uint256 amount) external {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        paymentToken.safeTransfer(to, amount);
    }

    function manualCreateFlow(address to, int96 flowRate) external {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        cs.cfaV1.createFlow(to, paymentToken, flowRate);
    }

    function manualDeleteFlow(address to) external {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        cs.cfaV1.deleteFlow(address(this), to, paymentToken);
    }
}
