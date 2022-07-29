// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibCFABasePCO.sol";
import "../interfaces/IBasePCO.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles basic PCO functionality using Constant Flow Agreement (CFA)
contract CFABasePCOFacet is IBasePCO {
    using CFAv1Library for CFAv1Library.InitData;

    /// @notice Emitted when an owner bid is updated
    event PayerContributionRateUpdated(
        address indexed _payer,
        int96 contributionRate
    );

    modifier onlyPayer() {
        require(
            msg.sender == payer(),
            "BasePCOFacet: Only payer is allowed to perform this action"
        );
        _;
    }

    /**
     * @notice Initialize bid.
     *      - Must be the contract owner
     *      - Must have payment token buffer deposited
     *      - Must have permissions to create flow for bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function initializeBid(
        IPCOLicenseParamsStore paramsStore,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice
    ) external {
        LibDiamond.enforceIsContractOwner();

        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        ds.paramsStore = paramsStore;

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
            "BasePCOFacet: Incorrect for sale price"
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
        address beneficiary = ds.paramsStore.getBeneficiary();

        // Create flow (payer -> license)
        cs.cfaV1.createFlowByOperator(
            bidder,
            address(this),
            paymentToken,
            newContributionRate
        );

        // Create flow (license -> beneficiary)
        cs.cfaV1.createFlow(beneficiary, paymentToken, newContributionRate);

        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();
        currentBid.timestamp = block.timestamp;
        currentBid.bidder = bidder;
        currentBid.contributionRate = newContributionRate;
        currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        currentBid.forSalePrice = newForSalePrice;

        emit PayerForSalePriceUpdated(bidder, newForSalePrice);
        emit PayerContributionRateUpdated(bidder, newContributionRate);
    }

    /**
     * @notice Current payer of license
     */
    function payer() public view returns (address) {
        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();
        return currentBid.bidder;
    }

    /**
     * @notice Current contribution rate of payer
     */
    function contributionRate() public view returns (int96) {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            ds.paramsStore.getPaymentToken(),
            payer(),
            address(this)
        );

        return flowRate;
    }

    /**
     * @notice Current price needed to purchase license
     */
    function forSalePrice() external view returns (uint256) {
        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();
        int96 _contributionRate = contributionRate();

        if (_contributionRate == currentBid.contributionRate) {
            // Contribution rate has not been changed, use rounded forSalePrice
            return currentBid.forSalePrice;
        } else {
            // Contribution rate was changed, used calculated for sale price
            return LibCFABasePCO.calculateForSalePrice(_contributionRate);
        }
    }

    /**
     * @notice Is current bid actively being paid
     */
    function isBidActive() external view returns (bool) {
        return contributionRate() > 0;
    }

    /**
     * @notice Edit bid. Must be the current payer
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     */
    function editBid(int96 newContributionRate, uint256 newForSalePrice)
        external
        onlyPayer
    {
        LibCFABasePCO.DiamondStorage storage ds = LibCFABasePCO
            .diamondStorage();
        LibCFABasePCO.DiamondCFAStorage storage cs = LibCFABasePCO.cfaStorage();

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
            "BasePCOFacet: Incorrect for sale price"
        );

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();
        address beneficiary = ds.paramsStore.getBeneficiary();

        // Update flow (payer -> license)
        cs.cfaV1.updateFlowByOperator(
            payer(),
            address(this),
            paymentToken,
            newContributionRate
        );

        // Update flow (license -> beneficiary)
        cs.cfaV1.updateFlow(beneficiary, paymentToken, newContributionRate);

        LibCFABasePCO.Bid storage currentBid = LibCFABasePCO.currentBid();
        currentBid.timestamp = block.timestamp;
        currentBid.bidder = payer();
        currentBid.contributionRate = newContributionRate;
        currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        currentBid.forSalePrice = newForSalePrice;

        emit PayerForSalePriceUpdated(payer(), newForSalePrice);
        emit PayerContributionRateUpdated(payer(), newContributionRate);
    }
}
