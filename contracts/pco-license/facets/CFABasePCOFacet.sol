// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibCFABasePCO.sol";
import "../interfaces/IBasePCO.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";

contract CFABasePCOFacetModifiers {
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
contract CFABasePCOFacet is IBasePCO, CFABasePCOFacetModifiers {
    using CFAv1Library for CFAv1Library.InitData;

    /// @notice Emitted when an owner bid is updated
    event PayerContributionRateUpdated(
        address indexed _payer,
        int96 contributionRate
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
    ) external {
        LibDiamond.enforceIsContractOwner();

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        ds.paramsStore = paramsStore;
        ds.license = initLicense;
        ds.licenseId = initLicenseId;
        ds.beneficiary = beneficiary;

        require(
            newForSalePrice >= ds.paramsStore.getMinForSalePrice(),
            "CFABasePCOFacet: Minimum for sale price not met"
        );

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        require(
            LibCFABasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "CFABasePCOFacet: Incorrect for sale price"
        );

        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();
        ISuperfluid host = ds.paramsStore.getHost();
        cs.cfaV1 = CFAv1Library.InitData(
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
        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        LibCFABasePCO.Bid storage _currentBid = LibCFABasePCO._currentBid();
        _currentBid.timestamp = block.timestamp;
        _currentBid.bidder = bidder;
        _currentBid.contributionRate = newContributionRate;
        _currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        _currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        _currentBid.forSalePrice = newForSalePrice;

        emit PayerForSalePriceUpdated(bidder, newForSalePrice);
        emit PayerContributionRateUpdated(bidder, newContributionRate);

        // Create flow (payer -> license)
        cs.cfaV1.createFlowByOperator(
            bidder,
            address(this),
            paymentToken,
            newContributionRate
        );

        // Create flow (license -> beneficiary)
        cs.cfaV1.createFlow(
            address(beneficiary),
            paymentToken,
            newContributionRate
        );
    }

    /**
     * @notice Current payer of license
     */
    function payer() external view override returns (address) {
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
    function forSalePrice() external view override returns (uint256) {
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
    function licenseId() external view override returns (uint256) {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        return ds.licenseId;
    }

    /**
     * @notice License
     */
    function license() external view override returns (IERC721) {
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
}
