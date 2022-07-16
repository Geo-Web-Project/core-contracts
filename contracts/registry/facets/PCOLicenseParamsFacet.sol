// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibPCOLicenseParams.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";

/// @title Public access to global Claimer parameters
contract PCOLicenseParamsFacet is IPCOLicenseParamsStore {
    /// @notice Constant flow agreement
    function getCFA()
        external
        view
        override
        returns (IConstantFlowAgreementV1)
    {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.cfaV1.cfa;
    }

    /// @notice Payment token
    function getPaymentToken() external view override returns (ISuperToken) {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.paymentToken;
    }

    /// @notice Beneficiary
    function getBeneficiary() external view override returns (address) {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.beneficiary;
    }

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator()
        external
        view
        override
        returns (uint256)
    {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.perSecondFeeNumerator;
    }

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator()
        external
        view
        override
        returns (uint256)
    {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.perSecondFeeDenominator;
    }

    /// @notice the final/minimum required bid reached and maintained at the end of the auction.
    function getReclaimAuctionLength()
        external
        view
        override
        returns (uint256)
    {
        LibBasePCOLicenseParams.DiamondStorage
            storage ds = LibBasePCOLicenseParams.diamondStorage();

        return ds.reclaimAuctionLength;
    }
}
