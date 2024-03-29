// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

library LibCFABasePCO {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;

    bytes32 private constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibBasePCO");

    bytes32 private constant STORAGE_POSITION_CUR_BID =
        keccak256("diamond.standard.diamond.storage.LibBasePCO.currentBid");

    bytes32 private constant STORAGE_POSITION_CFA =
        keccak256("diamond.standard.diamond.storage.LibBasePCO.cfa");

    struct Bid {
        uint256 timestamp;
        address bidder;
        int96 contributionRate;
        uint256 perSecondFeeNumerator;
        uint256 perSecondFeeDenominator;
        uint256 forSalePrice;
        bytes contentHash;
    }

    struct DiamondStorage {
        IPCOLicenseParamsStore paramsStore;
        IERC721 license;
        uint256 licenseId;
        ICFABeneficiary beneficiary;
    }

    struct DiamondCFAStorage {
        CFAv1Library.InitData cfaV1;
    }

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

    /// @notice Emitted when content hash is updated
    event PayerContentHashUpdated(address indexed _payer, bytes contentHash);

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    /// @dev Store currentBid in separate position so struct is upgradeable
    function _currentBid() internal pure returns (Bid storage bid) {
        bytes32 position = STORAGE_POSITION_CUR_BID;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            bid.slot := position
        }
    }

    /// @dev Store cfa in separate position so struct is upgradeable
    function cfaStorage() internal pure returns (DiamondCFAStorage storage ds) {
        bytes32 position = STORAGE_POSITION_CFA;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ds.slot := position
        }
    }

    /// @dev Get beneficiary or default if not set
    function _getBeneficiary() internal view returns (address) {
        DiamondStorage storage ds = diamondStorage();
        return address(ds.beneficiary);
    }

    function _checkForSalePrice(
        uint256 forSalePrice,
        int96 contributionRate,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) internal pure returns (bool) {
        uint256 calculatedContributionRate = (forSalePrice *
            _perSecondFeeNumerator) / _perSecondFeeDenominator;

        return calculatedContributionRate == uint96(contributionRate);
    }

    function _contributionRate() internal view returns (int96) {
        DiamondStorage storage ds = diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();

        // Get flow rate (app -> beneficiary)
        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            ds.paramsStore.getPaymentToken(),
            address(this),
            address(_getBeneficiary())
        );

        return flowRate;
    }

    function _isPayerBidActive() internal view returns (bool) {
        return _contributionRate() > 0;
    }

    function _createBeneficiaryFlow(int96 newContributionRate) internal {
        DiamondCFAStorage storage cs = cfaStorage();
        DiamondStorage storage ds = diamondStorage();

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        // Create to stored beneficiary
        cs.cfaV1.createFlow(
            address(ds.beneficiary),
            paymentToken,
            newContributionRate
        );
    }

    /**
     * @notice Initialize bid.
     * @param paramsStore Global store for parameters
     * @param initLicense Underlying ERC721 license
     * @param initLicenseId Token ID of license
     * @param bidder Initial bidder
     * @param newContributionRate New contribution rate for bid
     * @param newForSalePrice Intented new for sale price. Must be within rounding bounds of newContributionRate
     * @param contentHash Content hash for parcel content
     */
    function _initializeBid(
        ICFABeneficiary beneficiary,
        IPCOLicenseParamsStore paramsStore,
        IERC721 initLicense,
        uint256 initLicenseId,
        address bidder,
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes memory contentHash
    ) internal {
        DiamondStorage storage ds = diamondStorage();
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
            _checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "LibCFABasePCO: Incorrect for sale price"
        );

        DiamondCFAStorage storage cs = cfaStorage();
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

        Bid storage bid = _currentBid();
        bid.timestamp = block.timestamp;
        bid.bidder = bidder;
        bid.contributionRate = newContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = newForSalePrice;
        bid.contentHash = contentHash;

        emit PayerForSalePriceUpdated(bidder, newForSalePrice);
        emit PayerContributionRateUpdated(bidder, newContributionRate);
        emit PayerContentHashUpdated(bidder, contentHash);

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

    function _editBid(int96 newContributionRate, uint256 newForSalePrice)
        internal
    {
        Bid storage bid = _currentBid();

        _editBid(newContributionRate, newForSalePrice, bid.contentHash);
    }

    function _editContentHash(bytes memory contentHash) internal {
        Bid storage bid = _currentBid();

        bid.contentHash = contentHash;

        emit PayerContentHashUpdated(bid.bidder, contentHash);
    }

    function _editBid(
        int96 newContributionRate,
        uint256 newForSalePrice,
        bytes memory contentHash
    ) internal {
        DiamondStorage storage ds = diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();
        Bid storage bid = _currentBid();

        require(
            newForSalePrice >= ds.paramsStore.getMinForSalePrice(),
            "LibCFABasePCO: Minimum for sale price not met"
        );

        uint256 perSecondFeeNumerator = ds
            .paramsStore
            .getPerSecondFeeNumerator();
        uint256 perSecondFeeDenominator = ds
            .paramsStore
            .getPerSecondFeeDenominator();
        require(
            _checkForSalePrice(
                newForSalePrice,
                newContributionRate,
                perSecondFeeNumerator,
                perSecondFeeDenominator
            ),
            "LibCFABasePCO: Incorrect for sale price"
        );

        ISuperToken paymentToken = ds.paramsStore.getPaymentToken();

        bid.timestamp = block.timestamp;
        bid.bidder = bid.bidder;
        bid.contributionRate = newContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = newForSalePrice;
        bid.contentHash = contentHash;

        emit PayerForSalePriceUpdated(bid.bidder, newForSalePrice);
        emit PayerContributionRateUpdated(bid.bidder, newContributionRate);
        emit PayerContentHashUpdated(bid.bidder, contentHash);

        (, uint256 deposit, , ) = paymentToken.realtimeBalanceOfNow(
            address(this)
        );
        uint256 requiredBuffer = cs.cfaV1.cfa.getDepositRequiredForFlowRate(
            paymentToken,
            newContributionRate
        );

        // Transfer required buffer in
        if (requiredBuffer > deposit) {
            paymentToken.safeTransferFrom(
                msg.sender,
                address(this),
                requiredBuffer - deposit
            );
        }

        (, int96 flowRate, , ) = cs.cfaV1.cfa.getFlow(
            paymentToken,
            bid.bidder,
            address(this)
        );
        if (flowRate > 0) {
            // Update flow (payer -> license)
            cs.cfaV1.updateFlowByOperator(
                bid.bidder,
                address(this),
                paymentToken,
                newContributionRate
            );
        } else {
            // Recreate flow (payer -> license)
            cs.cfaV1.createFlowByOperator(
                bid.bidder,
                address(this),
                paymentToken,
                newContributionRate
            );
        }

        address beneficiary = address(_getBeneficiary());
        (, flowRate, , ) = cs.cfaV1.cfa.getFlow(
            paymentToken,
            address(this),
            beneficiary
        );

        if (flowRate > 0) {
            // Update flow (license -> beneficiary)
            cs.cfaV1.updateFlow(beneficiary, paymentToken, newContributionRate);
        } else {
            // Recreate flow (license -> beneficiary)
            _createBeneficiaryFlow(newContributionRate);
        }

        // Refund buffer
        if (deposit > requiredBuffer) {
            paymentToken.safeTransfer(msg.sender, deposit - requiredBuffer);
        }
    }
}
