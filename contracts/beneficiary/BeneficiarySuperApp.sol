// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "./interfaces/ICFABeneficiary.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/Definitions.sol";
import {ISuperAgreement} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperAgreement.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "../registry/interfaces/IPCOLicenseParamsStore.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

contract BeneficiarySuperApp is SuperAppBase, ICFABeneficiary {
    using CFAv1Library for CFAv1Library.InitData;

    CFAv1Library.InitData private cfaV1;
    IPCOLicenseParamsStore private paramsStore;

    /// @notice Timestamp of last deletion from each beacon proxy
    mapping(address => uint256) public lastDeletion;

    constructor(IPCOLicenseParamsStore _paramsStore) {
        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP;

        ISuperfluid host = _paramsStore.getHost();
        host.registerApp(configWord);

        cfaV1 = CFAv1Library.InitData(
            host,
            IConstantFlowAgreementV1(
                address(
                    host.getAgreementClass(
                        keccak256(
                            "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
                        )
                    )
                )
            )
        );

        paramsStore = _paramsStore;
    }

    /// @notice Get last deletion for sender
    function getLastDeletion(address sender)
        external
        view
        override
        returns (uint256)
    {
        return lastDeletion[sender];
    }

    /**
     * @notice Set last deletion of beacon proxy to now
     * @param beaconProxy Beacon proxy
     */
    function _setLastDeletion(address beaconProxy) internal {
        lastDeletion[beaconProxy] = block.timestamp;
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
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        (, int96 flowRate, , ) = cfaV1.cfa.getFlowByID(
            paymentToken,
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
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        address beneficiary = paramsStore.getBeneficiary();

        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            paymentToken,
            address(this),
            beneficiary
        );

        if (flowRate > 0) {
            newCtx = cfaV1.updateFlowWithCtx(
                ctx,
                beneficiary,
                paymentToken,
                flowRate + amount
            );
        } else {
            newCtx = cfaV1.createFlowWithCtx(
                ctx,
                beneficiary,
                paymentToken,
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
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        address beneficiary = paramsStore.getBeneficiary();

        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            paymentToken,
            address(this),
            beneficiary
        );

        if (amount < flowRate) {
            newCtx = cfaV1.updateFlowWithCtx(
                ctx,
                beneficiary,
                paymentToken,
                flowRate - amount
            );
        } else if (flowRate > 0) {
            newCtx = cfaV1.deleteFlowWithCtx(
                ctx,
                address(this),
                beneficiary,
                paymentToken
            );
        } else {
            newCtx = ctx;
        }
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateAppToBeneficiaryFlow(_ctx, _agreementId, 0);
    }

    function beforeAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata
    )
        external
        view
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory cbdata)
    {
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        (, int96 flowRate, , ) = cfaV1.cfa.getFlowByID(
            paymentToken,
            _agreementId
        );
        cbdata = abi.encode(flowRate);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        int96 originalFlowRate = abi.decode(_cbdata, (int96));

        return
            _updateAppToBeneficiaryFlow(_ctx, _agreementId, originalFlowRate);
    }

    function beforeAgreementTerminated(
        ISuperToken, // _superToken,
        address, // _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata
    ) external view override onlyHost returns (bytes memory cbdata) {
        ISuperToken paymentToken = paramsStore.getPaymentToken();

        (, int96 flowRate, , ) = cfaV1.cfa.getFlowByID(
            paymentToken,
            _agreementId
        );
        cbdata = abi.encode(flowRate);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32,
        bytes calldata _agreementData,
        bytes calldata _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;

        address user;
        bool isUserToApp;
        {
            (address _sender, address _receiver) = abi.decode(
                _agreementData,
                (address, address)
            );
            isUserToApp = _receiver == address(this);
            user = isUserToApp ? _sender : _receiver;
        }

        int96 originalFlowRate = abi.decode(_cbdata, (int96));

        if (isUserToApp) {
            _setLastDeletion(user);
            return _decreaseAppToBeneficiaryFlow(_ctx, originalFlowRate);
        } else {
            return _ctx;
        }
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        ISuperToken paymentToken = paramsStore.getPaymentToken();

        return address(superToken) == address(paymentToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return
            ISuperAgreement(agreementClass).agreementType() ==
            keccak256(
                "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
            );
    }

    modifier onlyHost() {
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        ISuperfluid host = paramsStore.getHost();
        require(
            msg.sender == address(host),
            "BeneficiarySuperApp: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(
            _isSameToken(superToken),
            "BeneficiarySuperApp: not accepted token"
        );
        require(
            _isCFAv1(agreementClass),
            "BeneficiarySuperApp: only CFAv1 supported"
        );
        _;
    }
}
