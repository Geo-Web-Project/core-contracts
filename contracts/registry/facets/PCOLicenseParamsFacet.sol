// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibPCOLicenseParams.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {OwnableInternal} from "@solidstate/contracts/access/ownable/OwnableInternal.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";

/// @title Public access to global Claimer parameters
contract PCOLicenseParamsFacet is IPCOLicenseParamsStore {
    using OwnableStorage for OwnableStorage.Layout;

    modifier onlyOwner() {
        require(
            msg.sender == OwnableStorage.layout().owner,
            "Ownable: sender must be owner"
        );
        _;
    }

    /**
     * @notice Initialize.
     *      - Must be the contract owner
     * @param beneficiary Beneficiary of funds.
     * @param paymentToken Payment token.
     * @param host Superfluid host
     * @param perSecondFeeNumerator The numerator of the network-wide per second contribution fee.
     * @param perSecondFeeDenominator The denominator of the network-wide per second contribution fee.
     * @param penaltyNumerator The numerator of the penalty to pay to reject a bid.
     * @param penaltyDenominator The denominator of the penalty to pay to reject a bid.
     * @param bidPeriodLengthInSeconds Bid period length in seconds
     * @param reclaimAuctionLength when the required bid amount reaches its minimum value.
     */
    function initializeParams(
        ICFABeneficiary beneficiary,
        ISuperToken paymentToken,
        ISuperfluid host,
        uint256 perSecondFeeNumerator,
        uint256 perSecondFeeDenominator,
        uint256 penaltyNumerator,
        uint256 penaltyDenominator,
        uint256 bidPeriodLengthInSeconds,
        uint256 reclaimAuctionLength,
        uint256 minForSalePrice
    ) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.beneficiary = beneficiary;
        ds.paymentToken = paymentToken;
        ds.host = host;
        ds.perSecondFeeNumerator = perSecondFeeNumerator;
        ds.perSecondFeeDenominator = perSecondFeeDenominator;
        ds.penaltyNumerator = penaltyNumerator;
        ds.penaltyDenominator = penaltyDenominator;
        ds.bidPeriodLengthInSeconds = bidPeriodLengthInSeconds;
        ds.reclaimAuctionLength = reclaimAuctionLength;
        ds.minForSalePrice = minForSalePrice;
    }

    /// @notice Superfluid Host
    function getHost() external view override returns (ISuperfluid) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.host;
    }

    /// @notice Set Superfluid Host
    function setHost(ISuperfluid host) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.host = host;
    }

    /// @notice Payment token
    function getPaymentToken() external view override returns (ISuperToken) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.paymentToken;
    }

    /// @notice Set Payment Token
    function setPaymentToken(ISuperToken paymentToken) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.paymentToken = paymentToken;
    }

    /// @notice Beneficiary
    function getBeneficiary() external view override returns (ICFABeneficiary) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.beneficiary;
    }

    /// @notice Set Beneficiary
    function setBeneficiary(ICFABeneficiary beneficiary) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.beneficiary = beneficiary;
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

    /// @notice Set Per Second Fee Numerator
    function setPerSecondFeeNumerator(uint256 perSecondFeeNumerator)
        external
        onlyOwner
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.perSecondFeeNumerator = perSecondFeeNumerator;
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

    /// @notice Set Per Second Fee Denominator
    function setPerSecondFeeDenominator(uint256 perSecondFeeDenominator)
        external
        onlyOwner
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.perSecondFeeDenominator = perSecondFeeDenominator;
    }

    /// @notice The numerator of the penalty rate.
    function getPenaltyNumerator() external view override returns (uint256) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.penaltyNumerator;
    }

    /// @notice Set Penalty Numerator
    function setPenaltyNumerator(uint256 penaltyNumerator) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.penaltyNumerator = penaltyNumerator;
    }

    /// @notice The denominator of the penalty rate.
    function getPenaltyDenominator() external view override returns (uint256) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.penaltyDenominator;
    }

    /// @notice Set Penalty Denominator
    function setPenaltyDenominator(uint256 penaltyDenominator)
        external
        onlyOwner
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.penaltyDenominator = penaltyDenominator;
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

    /// @notice Set Reclaim Auction Length
    function setReclaimAuctionLength(uint256 reclaimAuctionLength)
        external
        onlyOwner
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.reclaimAuctionLength = reclaimAuctionLength;
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

    /// @notice Set Bid Period Length in seconds
    function setBidPeriodLengthInSeconds(uint256 bidPeriodLengthInSeconds)
        external
        onlyOwner
    {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.bidPeriodLengthInSeconds = bidPeriodLengthInSeconds;
    }

    /// @notice Minimum for sale price
    function getMinForSalePrice() external view override returns (uint256) {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        return ds.minForSalePrice;
    }

    /// @notice Set minimum for sale price
    function setMinForSalePrice(uint256 minForSalePrice) external onlyOwner {
        LibPCOLicenseParams.DiamondStorage storage ds = LibPCOLicenseParams
            .diamondStorage();

        ds.minForSalePrice = minForSalePrice;
    }
}
