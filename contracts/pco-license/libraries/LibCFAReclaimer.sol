// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "./LibCFABasePCO.sol";

library LibCFAReclaimer {
    using CFAv1Library for CFAv1Library.InitData;

    /// @notice Trigger transfer of license
    function _triggerTransfer(
        int96 contributionRate,
        uint256 forSalePrice,
        uint256 perSecondFeeDenominator,
        uint256 perSecondFeeNumerator,
        ISuperToken paymentToken
    ) internal {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();

        // Create bidder flow
        try
            cs.cfaV1.host.callAgreement(
                cs.cfaV1.cfa,
                abi.encodeCall(
                    cs.cfaV1.cfa.createFlowByOperator,
                    (
                        paymentToken,
                        msg.sender,
                        address(this),
                        contributionRate,
                        new bytes(0)
                    )
                ),
                new bytes(0)
            )
        {} catch {}

        // Update beneficiary flow
        address beneficiary = ds.paramsStore.getBeneficiary();
        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            paymentToken,
            address(this),
            beneficiary
        );
        if (flowRate > 0) {
            cs.cfaV1.updateFlow(beneficiary, paymentToken, contributionRate);
        } else {
            cs.cfaV1.createFlow(beneficiary, paymentToken, contributionRate);
        }

        // Transfer license
        ds.license.safeTransferFrom(
            _currentBid.bidder,
            msg.sender,
            ds.licenseId
        );

        _currentBid.timestamp = block.timestamp;
        _currentBid.bidder = msg.sender;
        _currentBid.contributionRate = contributionRate;
        _currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        _currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        _currentBid.forSalePrice = forSalePrice;
    }
}
