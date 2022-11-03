// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibPCOLicenseClaimer.sol";
import "../libraries/LibPCOLicenseParams.sol";
import "../libraries/LibGeoWebParcelV2.sol";
import "../../pco-license/facets/CFABasePCOFacet.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import {BeaconDiamond} from "../../beacon-diamond/BeaconDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";
import {ERC721BaseInternal} from "@solidstate/contracts/token/ERC721/base/ERC721Base.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";

abstract contract IPCOLicenseClaimerFacetV2 {
    using CFAv1Library for CFAv1Library.InitData;
    using SafeERC20 for ISuperToken;
    using OwnableStorage for OwnableStorage.Layout;

    /// @notice Emitted when a parcel is claimed
    event ParcelClaimedV2(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice Claim a new parcel and license
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param parcel New parcel
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        LibGeoWebParcelV2.LandParcel memory parcel
    ) external {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();
        LibPCOLicenseParams.DiamondStorage storage ls = LibPCOLicenseParams
            .diamondStorage();

        uint256 _requiredBid = LibPCOLicenseClaimer._requiredBid();
        require(
            initialForSalePrice >= _requiredBid,
            "PCOLicenseClaimerFacetV2: Initial for sale price does not meet requirement"
        );

        uint256 licenseId = LibGeoWebParcel.nextId();

        BeaconDiamond proxy = new BeaconDiamond{
            salt: keccak256(
                abi.encodePacked(msg.sender, ds.userSalts[msg.sender])
            )
        }(address(this), IDiamondReadable(ds.beacon));

        // Increment user salt
        ds.userSalts[msg.sender] += 1;

        // Store beacon proxy
        ds.beaconProxies[licenseId] = address(proxy);

        emit ParcelClaimedV2(licenseId, msg.sender);

        // Build and mint
        _buildAndMint(msg.sender, parcel);

        {
            // Transfer required buffer
            IConstantFlowAgreementV1 cfa = IConstantFlowAgreementV1(
                address(
                    ls.host.getAgreementClass(
                        keccak256(
                            "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
                        )
                    )
                )
            );
            uint256 requiredBuffer = cfa.getDepositRequiredForFlowRate(
                ls.paymentToken,
                initialContributionRate
            );
            ls.paymentToken.safeTransferFrom(
                msg.sender,
                address(proxy),
                requiredBuffer
            );
        }

        // Initialize beacon
        CFABasePCOFacet(address(proxy)).initializeBid(
            ls.beneficiary,
            IPCOLicenseParamsStore(address(this)),
            IERC721(address(this)),
            licenseId,
            msg.sender,
            initialContributionRate,
            initialForSalePrice
        );

        // Transfer initial payment
        if (_requiredBid > 0) {
            ls.paymentToken.safeTransferFrom(
                msg.sender,
                address(ls.beneficiary),
                _requiredBid
            );
        }
    }

    /**
     * @notice Build a parcel and mint a license
     * @param user Address of license owner to be
     * @param parcel New parcel
     */
    function _buildAndMint(
        address user,
        LibGeoWebParcelV2.LandParcel memory parcel
    ) internal virtual;
}

contract PCOLicenseClaimerFacetV2 is
    IPCOLicenseClaimerFacetV2,
    ERC721BaseInternal
{
    /**
     * @notice Build a parcel and mint a license
     * @param user Address of license owner to be
     * @param parcel New parcel
     */
    function _buildAndMint(
        address user,
        LibGeoWebParcelV2.LandParcel memory parcel
    ) internal override {
        uint256 licenseId = LibGeoWebParcel.nextId();
        LibGeoWebParcelV2.build(parcel);
        _safeMint(user, licenseId);
    }
}
