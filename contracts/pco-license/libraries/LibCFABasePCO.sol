// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
    }

    struct DiamondStorage {
        IPCOLicenseParamsStore paramsStore;
        IERC721 license;
        uint256 licenseId;
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
            ds.paramsStore.getBeneficiary()
        );

        return flowRate;
    }

    function _isPayerBidActive() internal view returns (bool) {
        return _contributionRate() > 0;
    }

    function _editBid(int96 newContributionRate, uint256 newForSalePrice)
        internal
    {
        DiamondStorage storage ds = diamondStorage();
        DiamondCFAStorage storage cs = cfaStorage();
        Bid storage bid = _currentBid();

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
        address beneficiary = ds.paramsStore.getBeneficiary();

        bid.timestamp = block.timestamp;
        bid.bidder = bid.bidder;
        bid.contributionRate = newContributionRate;
        bid.perSecondFeeNumerator = perSecondFeeNumerator;
        bid.perSecondFeeDenominator = perSecondFeeDenominator;
        bid.forSalePrice = newForSalePrice;

        emit PayerForSalePriceUpdated(bid.bidder, newForSalePrice);
        emit PayerContributionRateUpdated(bid.bidder, newContributionRate);

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
            cs.cfaV1.createFlow(beneficiary, paymentToken, newContributionRate);
        }

        // Refund buffer
        if (deposit > requiredBuffer) {
            paymentToken.safeTransfer(msg.sender, deposit - requiredBuffer);
        }
    }
}
