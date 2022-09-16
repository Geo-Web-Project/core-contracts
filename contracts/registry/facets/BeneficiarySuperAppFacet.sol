// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "../libraries/LibPCOLicenseParams.sol";
import "../libraries/LibBeneficiarySuperApp.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/Definitions.sol";
import {ISuperAgreement} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperAgreement.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

contract BeneficiarySuperAppFacet is SuperAppBase {
    function initializeSuperApp() external {
        LibDiamond.enforceIsContractOwner();

        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        LibBeneficiarySuperApp.DiamondCFAStorage
            storage cs = LibBeneficiarySuperApp.cfaStorage();

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP;

        ds.host.registerApp(configWord);

        cs.cfaV1 = CFAv1Library.InitData(
            ds.host,
            IConstantFlowAgreementV1(
                address(
                    ds.host.getAgreementClass(
                        keccak256(
                            "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
                        )
                    )
                )
            )
        );
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
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        LibBeneficiarySuperApp.DiamondCFAStorage
            storage cs = LibBeneficiarySuperApp.cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlowByID(
            ds.paymentToken,
            _agreementId
        );

        return
            LibBeneficiarySuperApp._increaseAppToBeneficiaryFlowWithCtx(
                _ctx,
                flowRate
            );
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
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        LibBeneficiarySuperApp.DiamondCFAStorage
            storage cs = LibBeneficiarySuperApp.cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlowByID(
            ds.paymentToken,
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
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        LibBeneficiarySuperApp.DiamondCFAStorage
            storage cs = LibBeneficiarySuperApp.cfaStorage();

        int96 originalFlowRate = abi.decode(_cbdata, (int96));
        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlowByID(
            ds.paymentToken,
            _agreementId
        );

        if (originalFlowRate < flowRate) {
            return
                LibBeneficiarySuperApp._increaseAppToBeneficiaryFlowWithCtx(
                    _ctx,
                    flowRate - originalFlowRate
                );
        } else {
            return
                LibBeneficiarySuperApp._decreaseAppToBeneficiaryFlowWithCtx(
                    _ctx,
                    originalFlowRate - flowRate
                );
        }
    }

    function beforeAgreementTerminated(
        ISuperToken, // _superToken,
        address, // _agreementClass,
        bytes32 _agreementId,
        bytes calldata,
        bytes calldata
    ) external view override onlyHost returns (bytes memory cbdata) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();
        LibBeneficiarySuperApp.DiamondCFAStorage
            storage cs = LibBeneficiarySuperApp.cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlowByID(
            ds.paymentToken,
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
            LibBeneficiarySuperApp._setLastDeletion(user);
            return
                LibBeneficiarySuperApp._decreaseAppToBeneficiaryFlowWithCtx(
                    _ctx,
                    originalFlowRate
                );
        } else {
            return _ctx;
        }
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return address(superToken) == address(ds.paymentToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return
            ISuperAgreement(agreementClass).agreementType() ==
            keccak256(
                "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
            );
    }

    modifier onlyHost() {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        require(
            msg.sender == address(ds.host),
            "BeneficiarySuperAppFacet: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(
            _isSameToken(superToken),
            "BeneficiarySuperAppFacet: not accepted token"
        );
        require(
            _isCFAv1(agreementClass),
            "BeneficiarySuperAppFacet: only CFAv1 supported"
        );
        _;
    }
}
