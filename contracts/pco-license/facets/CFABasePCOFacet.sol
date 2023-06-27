// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFABasePCO.sol";
import "../interfaces/ICFABasePCO.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";

contract CFABasePCOFacetModifiers {
    using OwnableStorage for OwnableStorage.Layout;

    modifier onlyOwner() {
        require(
            msg.sender == OwnableStorage.layout().owner,
            "Ownable: sender must be owner"
        );
        _;
    }

    modifier onlyPayer() {
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        require(
            msg.sender == _currentBid.bidder,
            "CFABasePCOFacet: Only payer is allowed to perform this action"
        );
        _;
    }

    modifier onlyIfPayerBidActive() {
        require(
            LibCFABasePCO._isPayerBidActive(),
            "CFABasePCOFacet: Can only perform action when payer bid is active"
        );
        _;
    }

    modifier onlyNotPayer() {
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        require(
            msg.sender != _currentBid.bidder,
            "CFABasePCOFacet: Payer is not allowed to perform this action"
        );
        _;
    }
}

/// @notice Handles basic PCO functionality using Constant Flow Agreement (CFA)
contract CFABasePCOFacet is ICFABasePCO, CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;

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
     * @param newForSalePrice Intended new for sale price. Must be within rounding bounds of newContributionRate
     */
    function initializeBid(
        ICFABeneficiary beneficiary,
        IPCOLicenseParamsStore paramsStore,
        IERC721 initLicense,
        uint256 initLicenseId,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice
    ) external onlyOwner {
        LibCFABasePCO._initializeBid(
            beneficiary,
            paramsStore,
            initLicense,
            initLicenseId,
            bidder,
            newContributionRate,
            newForSalePrice,
            new bytes(0)
        );
    }

    /**
     * @notice Initialize bid with content hash
     *      - Must be the contract owner
     *      - Must have payment token buffer deposited
     *      - Must have permissions to create flow for bidder
     * @param paramsStore Global store for parameters
     * @param initLicense Underlying ERC721 license
     * @param initLicenseId Token ID of license
     * @param bidder Initial bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     * @param _contentHash Content hash for parcel content
     */
    function initializeBid(
        ICFABeneficiary beneficiary,
        IPCOLicenseParamsStore paramsStore,
        IERC721 initLicense,
        uint256 initLicenseId,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes calldata _contentHash
    ) external onlyOwner {
        LibCFABasePCO._initializeBid(
            beneficiary,
            paramsStore,
            initLicense,
            initLicenseId,
            bidder,
            newContributionRate,
            newForSalePrice,
            _contentHash
        );
    }

    /**
     * @notice Current payer of license
     */
    function payer() external view returns (address) {
        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        return _currentBid.bidder;
    }

    /**
     * @notice Current contribution rate of payer
     */
    function contributionRate() external view returns (int96) {
        return LibCFABasePCO._contributionRate();
    }

    /**
     * @notice Current price needed to purchase license
     */
    function forSalePrice() external view returns (uint256) {
        if (LibCFABasePCO._isPayerBidActive()) {
            LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
            return _currentBid.forSalePrice;
        } else {
            return 0;
        }
    }

    /**
     * @notice License Id
     */
    function licenseId() external view returns (uint256) {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        return ds.licenseId;
    }

    /**
     * @notice License
     */
    function license() external view returns (IERC721) {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        return ds.license;
    }

    /**
     * @notice Is current bid actively being paid
     */
    function isPayerBidActive() external view returns (bool) {
        return LibCFABasePCO._isPayerBidActive();
    }

    /**
     * @notice Get current bid
     */
    function currentBid() external pure returns (LibCFABasePCO.Bid memory) {
        LibCFABasePCO.Bid storage bid = LibCFABasePCO._currentBid();

        return bid;
    }

    /**
     * @notice Get content hash
     */
    function contentHash() external view returns (bytes memory) {
        LibCFABasePCO.Bid storage bid = LibCFABasePCO._currentBid();

        return bid.contentHash;
    }
}
