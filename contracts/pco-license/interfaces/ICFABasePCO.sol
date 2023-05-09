// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import "../libraries/LibCFABasePCO.sol";
import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";

interface ICFABasePCO {
    /// @notice Emitted when an owner bid is updated
    event PayerContributionRateUpdated(
        address indexed _payer,
        int96 contributionRate
    );

    /// @notice Emitted when for sale price is updated
    event PayerForSalePriceUpdated(
        address indexed _payer,
        uint256 forSalePrice
    );

    /**
     * @notice Initialize bid.
     *      - Must be the contract owner
     *      - Must have payment token buffer deposited
     *      - Must have permissions to create flow for bidder
     * @param paramsStore Global store for parameters
     * @param initLicense Underlying ERC721 license
     * @param initLicenseId Token ID of license
     * @param bidder Initial bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function initializeBid(
        ICFABeneficiary beneficiary,
        IPCOLicenseParamsStore paramsStore,
        IERC721 initLicense,
        uint256 initLicenseId,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice
    ) external;

    /**
     * @notice Initialize bid with a content hash.
     *      - Must be the contract owner
     *      - Must have payment token buffer deposited
     *      - Must have permissions to create flow for bidder
     * @param paramsStore Global store for parameters
     * @param initLicense Underlying ERC721 license
     * @param initLicenseId Token ID of license
     * @param bidder Initial bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function initializeBid(
        ICFABeneficiary beneficiary,
        IPCOLicenseParamsStore paramsStore,
        IERC721 initLicense,
        uint256 initLicenseId,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata contentHash
    ) external;

    /**
     * @notice Current payer of license
     */
    function payer() external view returns (address);

    /**
     * @notice Current contribution rate of payer
     */
    function contributionRate() external view returns (int96);

    /**
     * @notice Current price needed to purchase license
     */
    function forSalePrice() external view returns (uint256);

    /**
     * @notice License Id
     */
    function licenseId() external view returns (uint256);

    /**
     * @notice License
     */
    function license() external view returns (IERC721);

    /**
     * @notice Is current bid actively being paid
     */
    function isPayerBidActive() external view returns (bool);

    /**
     * @notice Get current bid
     */
    function currentBid() external pure returns (LibCFABasePCO.Bid memory);

    /**
     * @notice Get content hash
     */
    function contentHash() external view returns (bytes memory);
}
