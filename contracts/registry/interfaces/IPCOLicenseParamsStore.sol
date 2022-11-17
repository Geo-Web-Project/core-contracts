// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";

interface IPCOLicenseParamsStore {
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
    ) external;

    /// @notice Superfluid Host
    function getHost() external view returns (ISuperfluid);

    /// @notice Set Superfluid Host
    function setHost(ISuperfluid host) external;

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken);

    /// @notice Set Payment Token
    function setPaymentToken(ISuperToken paymentToken) external;

    /// @notice Beneficiary
    function getBeneficiary() external view returns (ICFABeneficiary);

    /// @notice Set Beneficiary
    function setBeneficiary(ICFABeneficiary beneficiary) external;

    /// @notice The numerator of the network-wide per second contribution fee.
    function getPerSecondFeeNumerator() external view returns (uint256);

    /// @notice Set Per Second Fee Numerator
    function setPerSecondFeeNumerator(uint256 perSecondFeeNumerator) external;

    /// @notice The denominator of the network-wide per second contribution fee.
    function getPerSecondFeeDenominator() external view returns (uint256);

    /// @notice Set Per Second Fee Denominator
    function setPerSecondFeeDenominator(uint256 perSecondFeeDenominator)
        external;

    /// @notice The numerator of the penalty rate.
    function getPenaltyNumerator() external view returns (uint256);

    /// @notice Set Penalty Numerator
    function setPenaltyNumerator(uint256 penaltyNumerator) external;

    /// @notice The denominator of the penalty rate.
    function getPenaltyDenominator() external view returns (uint256);

    /// @notice Set Penalty Denominator
    function setPenaltyDenominator(uint256 penaltyDenominator) external;

    /// @notice the final/minimum required bid reached and maintained at the end of the auction.
    function getReclaimAuctionLength() external view returns (uint256);

    /// @notice Set Reclaim Auction Length
    function setReclaimAuctionLength(uint256 reclaimAuctionLength) external;

    /// @notice Bid period length in seconds
    function getBidPeriodLengthInSeconds() external view returns (uint256);

    /// @notice Set Bid Period Length in seconds
    function setBidPeriodLengthInSeconds(uint256 bidPeriodLengthInSeconds)
        external;

    /// @notice Minimum for sale price
    function getMinForSalePrice() external view returns (uint256);

    /// @notice Set minimum for sale price
    function setMinForSalePrice(uint256 minForSalePrice) external;
}
