// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibPCOLicenseParams.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";

/// @title Public access to global Claimer parameters
contract PCOLicenseParamsFacet is IPCOLicenseParamsStore {
    /// @notice Superfluid Host
    function getHost() external view override returns (ISuperfluid) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.host;
    }

    /// @notice Payment token
    function getPaymentToken() external view override returns (ISuperToken) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.paymentToken;
    }

    /// @notice Beneficiary
    function getBeneficiary() external view override returns (address) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.beneficiary;
    }

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator()
        external
        view
        override
        returns (uint256)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.perSecondFeeNumerator;
    }

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator()
        external
        view
        override
        returns (uint256)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.perSecondFeeDenominator;
    }

    /// @notice The numerator of the penalty rate.
    function getPenaltyNumerator() external view returns (uint256) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.penaltyNumerator;
    }

    /// @notice The denominator of the penalty rate.
    function getPenaltyDenominator() external view returns (uint256) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.penaltyDenominator;
    }

    /// @notice the final/minimum required bid reached and maintained at the end of the auction.
    function getReclaimAuctionLength()
        external
        view
        override
        returns (uint256)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.reclaimAuctionLength;
    }

    /// @notice Bid period length in seconds
    function getBidPeriodLengthInSeconds()
        external
        view
        override
        returns (uint256)
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.bidPeriodLengthInSeconds;
    }
}
