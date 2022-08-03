// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../../registry/interfaces/IPCOLicenseParamsStore.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

library LibCFABasePCO {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.LibBasePCO");

    bytes32 constant STORAGE_POSITION_CUR_BID =
        keccak256("diamond.standard.diamond.storage.LibBasePCO.currentBid");

    bytes32 constant STORAGE_POSITION_CFA =
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

    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    /// @dev Store currentBid in separate position so struct is upgradeable
    function currentBid() internal pure returns (Bid storage bid) {
        bytes32 position = STORAGE_POSITION_CUR_BID;
        assembly {
            bid.slot := position
        }
    }

    /// @dev Store cfa in separate position so struct is upgradeable
    function cfaStorage() internal pure returns (DiamondCFAStorage storage ds) {
        bytes32 position = STORAGE_POSITION_CFA;
        assembly {
            ds.slot := position
        }
    }

    /// @notice Calculate for sale price from contribution rate
    function calculateForSalePrice(int96 contributionRate)
        internal
        view
        returns (uint256)
    {
        Bid storage _currentBid = currentBid();

        return
            (uint96(contributionRate) * _currentBid.perSecondFeeDenominator) /
            _currentBid.perSecondFeeNumerator;
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
}
