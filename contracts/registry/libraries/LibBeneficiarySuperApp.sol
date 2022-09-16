// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "./LibPCOLicenseParams.sol";

library LibBeneficiarySuperApp {
    using CFAv1Library for CFAv1Library.InitData;

    bytes32 private constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibBeneficiarySuperApp");

    bytes32 private constant STORAGE_POSITION_CFA =
        keccak256(
            "diamond.standard.diamond.storage.LibBeneficiarySuperApp.cfa"
        );

    struct DiamondStorage {
        /// @notice Timestamp of last deletion from each beacon proxy
        mapping(address => uint256) lastDeletion;
    }

    struct DiamondCFAStorage {
        CFAv1Library.InitData cfaV1;
    }

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    /// @dev Store cfa in separate position so struct is upgradeable
    function cfaStorage() internal pure returns (DiamondCFAStorage storage ds) {
        bytes32 position = STORAGE_POSITION_CFA;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    /**
     * @notice Set last deletion of beacon proxy to now
     * @param beaconProxy Beacon proxy
     */
    function _setLastDeletion(address beaconProxy) internal {
        DiamondStorage storage ds = diamondStorage();

        ds.lastDeletion[beaconProxy] = block.timestamp;
    }

    /**
     * @notice Increase flow to beneficiary
     * @param ctx CFA ctx
     * @param agreementId Agreement ID
     * @param originalFlowRate Original flow rate before update
     */
    function _updateAppToBeneficiaryFlow(
        bytes memory ctx,
        bytes32 agreementId,
        int96 originalFlowRate
    ) internal returns (bytes memory newCtx) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlowByID(
            ds.paymentToken,
            agreementId
        );

        if (originalFlowRate < flowRate) {
            return
                _increaseAppToBeneficiaryFlow(ctx, flowRate - originalFlowRate);
        } else {
            return
                _decreaseAppToBeneficiaryFlow(ctx, originalFlowRate - flowRate);
        }
    }

    /**
     * @notice Increase flow to beneficiary
     * @param ctx CFA ctx
     * @param amount Flow amount to increase
     */
    function _increaseAppToBeneficiaryFlow(bytes memory ctx, int96 amount)
        internal
        returns (bytes memory newCtx)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            ds.paymentToken,
            address(this),
            ds.beneficiary
        );

        if (flowRate > 0) {
            newCtx = cs.cfaV1.updateFlowWithCtx(
                ctx,
                ds.beneficiary,
                ds.paymentToken,
                flowRate + amount
            );
        } else {
            newCtx = cs.cfaV1.createFlowWithCtx(
                ctx,
                ds.beneficiary,
                ds.paymentToken,
                amount
            );
        }
    }

    /**
     * @notice Decrease flow to beneficiary
     * @param ctx CFA ctx
     * @param amount Flow amount to increase
     */
    function _decreaseAppToBeneficiaryFlow(bytes memory ctx, int96 amount)
        internal
        returns (bytes memory newCtx)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            ds.paymentToken,
            address(this),
            ds.beneficiary
        );

        if (amount < flowRate) {
            newCtx = cs.cfaV1.updateFlowWithCtx(
                ctx,
                ds.beneficiary,
                ds.paymentToken,
                flowRate - amount
            );
        } else if (flowRate > 0) {
            newCtx = cs.cfaV1.deleteFlowWithCtx(
                ctx,
                address(this),
                ds.beneficiary,
                ds.paymentToken
            );
        }
    }
}
