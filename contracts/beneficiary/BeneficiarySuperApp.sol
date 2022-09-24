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
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BeneficiarySuperApp is SuperAppBase, ICFABeneficiary, Ownable {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    CFAv1Library.InitData private cfaV1;
    IPCOLicenseParamsStore private paramsStore;

    /// @notice Timestamp of last deletion from each beacon proxy
    mapping(address => uint256) public lastDeletion;

    /// @notice Beneficiary of funds.
    address public beneficiary;

    constructor(IPCOLicenseParamsStore _paramsStore, address _beneficiary) {
        require(
            _beneficiary != address(0x0),
            "BeneficiarySuperApp: Beneficiary cannot be 0x0"
        );

        paramsStore = _paramsStore;
        beneficiary = _beneficiary;

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.AFTER_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.AFTER_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

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

        // Approve beneficiary to transfer payment token
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        paymentToken.safeIncreaseAllowance(beneficiary, type(uint256).max);
    }

    /// @notice Beneficiary
    function getBeneficiary() external view returns (address) {
        return beneficiary;
    }

    /// @notice Set Beneficiary
    function setBeneficiary(address _beneficiary) external onlyOwner {
        require(
            _beneficiary != address(0x0),
            "BeneficiarySuperApp: Beneficiary cannot be 0x0"
        );

        address oldBeneficiary = beneficiary;
        beneficiary = _beneficiary;

        // Revoke old beneficiary to transfer payment token
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        paymentToken.safeDecreaseAllowance(oldBeneficiary, type(uint256).max);

        // Approve beneficiary to transfer payment token
        paymentToken.safeIncreaseAllowance(beneficiary, type(uint256).max);
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

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32,
        bytes calldata _agreementData,
        bytes calldata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;

        (address _sender, ) = abi.decode(_agreementData, (address, address));
        _setLastDeletion(_sender);

        return _ctx;
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
}
