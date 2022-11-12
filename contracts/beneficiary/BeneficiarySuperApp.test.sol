// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./BeneficiarySuperApp.sol";
import "../registry/interfaces/IPCOLicenseParamsStore.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockParamsStore is IPCOLicenseParamsStore {
    ERC20Upgradeable private mockERC20;

    constructor(ERC20Upgradeable mockERC20_) {
        mockERC20 = mockERC20_;
    }

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken) {
        return ISuperToken(address(mockERC20));
    }

    /// @notice Superfluid Host
    function getHost() external pure returns (ISuperfluid) {
        return ISuperfluid(address(0x1));
    }

    /// @notice Beneficiary
    function getBeneficiary() external pure returns (ICFABeneficiary) {
        return ICFABeneficiary(address(0x1));
    }

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator() external pure returns (uint256) {
        return 1;
    }

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator() external pure returns (uint256) {
        return 2;
    }

    /// @notice The numerator of the penalty rate.
    function getPenaltyNumerator() external pure returns (uint256) {
        return 3;
    }

    /// @notice The denominator of the penalty rate.
    function getPenaltyDenominator() external pure returns (uint256) {
        return 4;
    }

    /// @notice when the required bid amount reaches its minimum value.
    function getReclaimAuctionLength() external pure returns (uint256) {
        return 5;
    }

    /// @notice Bid period length in seconds
    function getBidPeriodLengthInSeconds() external pure returns (uint256) {
        return 6;
    }

    /// @notice Minimum for sale price
    function getMinForSalePrice() external pure returns (uint256) {
        return 7;
    }
}

contract FuzzyBeneficiarySuperApp is BeneficiarySuperApp, ERC20Upgradeable {
    MockParamsStore private mockParamsStore;

    constructor() {
        _mint(address(this), 1000);
        mockParamsStore = new MockParamsStore(this);
        paramsStore = mockParamsStore;
        beneficiary = address(0x2);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_beneficiary_never_changes() public view returns (bool) {
        return beneficiary == address(0x2);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_params_store_never_changes() public view returns (bool) {
        return address(paramsStore) == address(mockParamsStore);
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_balance_never_decreases() public view returns (bool) {
        return balanceOf(address(this)) >= 1000;
    }
}
