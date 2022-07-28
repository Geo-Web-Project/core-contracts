// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibBasePCO.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

/// @notice Handles basic PCO functionality
contract BasePCOFacet {
    using CFAv1Library for CFAv1Library.InitData;

    /// @notice Emitted when an owner bid is updated
    event PayerBidUpdated(
        address indexed _payer,
        int96 contributionRate,
        uint256 forSalePrice
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

        LibBasePCO.DiamondStorage storage ds = LibBasePCO.diamondStorage();
        ds.paramsStore = paramsStore;

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        require(
            LibBasePCO._checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "BasePCOFacet: Incorrect for sale price"
        );

        LibBasePCO.DiamondCFAStorage storage cs = LibBasePCO.cfaStorage();
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

        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        currentBid.timestamp = block.timestamp;
        currentBid.bidder = bidder;
        currentBid.contributionRate = newContributionRate;
        currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        currentBid.forSalePrice = newForSalePrice;

        emit LibBasePCO.PayerBidUpdated(
            bidder,
            newContributionRate,
            newForSalePrice
        );
    }

    /**
     * @notice Current payer of license
     */
    function payer() public view returns (address) {
        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        return currentBid.bidder;
    }

    /**
     * @notice Current contribution rate of payer
     */
    function contributionRate() public view returns (int96) {
        LibBasePCO.DiamondStorage storage ds = LibBasePCO.diamondStorage();
        LibBasePCO.DiamondCFAStorage storage cs = LibBasePCO.cfaStorage();

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
        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        int96 _contributionRate = contributionRate();

        if (_contributionRate == currentBid.contributionRate) {
            // Contribution rate has not been changed, use rounded forSalePrice
            return currentBid.forSalePrice;
        } else {
            // Contribution rate was changed, used calculated for sale price
            return LibBasePCO.calculateForSalePrice(_contributionRate);
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
        LibBasePCO.DiamondStorage storage ds = LibBasePCO.diamondStorage();
        LibBasePCO.DiamondCFAStorage storage cs = LibBasePCO.cfaStorage();

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        require(
            LibBasePCO._checkForSalePrice(
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

        LibBasePCO.Bid storage currentBid = LibBasePCO.currentBid();
        currentBid.timestamp = block.timestamp;
        currentBid.bidder = payer();
        currentBid.contributionRate = newContributionRate;
        currentBid.perSecondFeeNumerator = perSecondFeeNumerator;
        currentBid.perSecondFeeDenominator = perSecondFeeDenominator;
        currentBid.forSalePrice = newForSalePrice;

        emit LibBasePCO.PayerBidUpdated(
            payer(),
            newContributionRate,
            newForSalePrice
        );
    }
}
