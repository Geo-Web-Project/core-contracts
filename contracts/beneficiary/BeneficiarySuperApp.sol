// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "./interfaces/ICFABeneficiary.sol";
import {SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/Definitions.sol";
import {ISuperAgreement} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperAgreement.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "../registry/interfaces/IPCOLicenseParamsStore.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BeneficiarySuperApp is
    SuperAppBase,
    ICFABeneficiary,
    Initializable,
    OwnableUpgradeable
{
    using CFAv1Library for CFAv1Library.InitData;

    CFAv1Library.InitData private cfaV1;
    IPCOLicenseParamsStore internal paramsStore;

    /// @notice Timestamp of last deletion from each beacon proxy
    mapping(address => uint256) public lastDeletion;

    /// @notice Beneficiary of funds.
    address public beneficiary;

    function initialize(
        IPCOLicenseParamsStore paramsStore_,
        address beneficiary_
    ) external initializer {
        __Ownable_init();

        require(
            beneficiary_ != address(0x0),
            "BeneficiarySuperApp: Beneficiary cannot be 0x0"
        );

        paramsStore = paramsStore_;
        beneficiary = beneficiary_;

        ISuperfluid host = paramsStore.getHost();

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
        SafeERC20Upgradeable.safeIncreaseAllowance(
            IERC20Upgradeable(address(paymentToken)),
            beneficiary,
            type(uint256).max
        );

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.AFTER_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.AFTER_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        host.registerApp(configWord);
    }

    /// @notice Params Store
    function getParamsStore() external view returns (IPCOLicenseParamsStore) {
        return paramsStore;
    }

    /// @notice Set Params Store
    function setParamsStore(IPCOLicenseParamsStore paramsStore_)
        external
        onlyOwner
    {
        paramsStore = paramsStore_;
    }

    /// @notice Beneficiary
    function getBeneficiary() external view returns (address) {
        return beneficiary;
    }

    /// @notice Set Beneficiary
    function setBeneficiary(address beneficiary_) external onlyOwner {
        require(
            beneficiary_ != address(0x0),
            "BeneficiarySuperApp: Beneficiary cannot be 0x0"
        );

        address oldBeneficiary = beneficiary;
        beneficiary = beneficiary_;

        // Revoke old beneficiary to transfer payment token
        ISuperToken paymentToken = paramsStore.getPaymentToken();
        SafeERC20Upgradeable.safeDecreaseAllowance(
            IERC20Upgradeable(address(paymentToken)),
            oldBeneficiary,
            type(uint256).max
        );

        // Approve beneficiary to transfer payment token
        SafeERC20Upgradeable.safeIncreaseAllowance(
            IERC20Upgradeable(address(paymentToken)),
            beneficiary,
            type(uint256).max
        );
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
        ISuperToken superToken,
        address agreementClass,
        bytes32,
        bytes calldata agreementData,
        bytes calldata,
        bytes calldata ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(superToken) || !_isCFAv1(agreementClass)) return ctx;

        (address _sender, ) = abi.decode(agreementData, (address, address));
        _setLastDeletion(_sender);

        return ctx;
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
