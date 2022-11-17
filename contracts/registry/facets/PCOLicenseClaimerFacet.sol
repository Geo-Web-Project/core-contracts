// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/LibPCOLicenseClaimer.sol";
import "../libraries/LibPCOLicenseParams.sol";
import "../../pco-license/interfaces/ICFABasePCO.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import "../interfaces/IPCOLicenseClaimer.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import {BeaconDiamond} from "../../beacon-diamond/BeaconDiamond.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../beneficiary/interfaces/ICFABeneficiary.sol";
import {ERC721BaseInternal} from "@solidstate/contracts/token/ERC721/base/ERC721Base.sol";
import {IDiamondReadable} from "@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol";
import {OwnableStorage} from "@solidstate/contracts/access/ownable/OwnableStorage.sol";

contract PCOLicenseClaimerFacetV1 is IPCOLicenseClaimerV1, ERC721BaseInternal {
    using SafeERC20 for ISuperToken;
    using OwnableStorage for OwnableStorage.Layout;

    modifier onlyOwner() {
        require(
            msg.sender == OwnableStorage.layout().owner,
            "Ownable: sender must be owner"
        );
        _;
    }

    /**
     * @notice Initialize.
     *      - Must be the contract owner
     * @param auctionStart start time of the genesis land parcel auction.
     * @param auctionEnd when the required bid amount reaches its minimum value.
     * @param startingBid start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
     * @param endingBid the final/minimum required bid reached and maintained at the end of the auction.
     * @param beacon The beacon contract for PCO licenses
     */
    function initializeClaimer(
        uint256 auctionStart,
        uint256 auctionEnd,
        uint256 startingBid,
        uint256 endingBid,
        address beacon
    ) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.auctionStart = auctionStart;
        ds.auctionEnd = auctionEnd;
        ds.startingBid = startingBid;
        ds.endingBid = endingBid;
        ds.beacon = beacon;
    }

    /**
     * @notice Admin can update the starting bid.
     * @param startingBid The new starting bid
     */
    function setStartingBid(uint256 startingBid) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.startingBid = startingBid;
    }

    /// @notice Starting bid
    function getStartingBid() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.startingBid;
    }

    /**
     * @notice Admin can update the ending bid.
     * @param endingBid The new ending bid
     */
    function setEndingBid(uint256 endingBid) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.endingBid = endingBid;
    }

    /// @notice Ending bid
    function getEndingBid() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.endingBid;
    }

    /**
     * @notice Admin can update the start time of the initial Dutch auction.
     * @param auctionStart The new start time of the initial Dutch auction
     */
    function setAuctionStart(uint256 auctionStart) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.auctionStart = auctionStart;
    }

    /// @notice Auction start
    function getAuctionStart() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.auctionStart;
    }

    /**
     * @notice Admin can update the end time of the initial Dutch auction.
     * @param auctionEnd The new end time of the initial Dutch auction
     */
    function setAuctionEnd(uint256 auctionEnd) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.auctionEnd = auctionEnd;
    }

    /// @notice Auction end
    function getAuctionEnd() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.auctionEnd;
    }

    /**
     * @notice Admin can update the beacon contract
     * @param beacon The new beacon contract
     */
    function setBeacon(address beacon) external onlyOwner {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.beacon = beacon;
    }

    /// @notice Get Beacon
    function getBeacon() external view returns (address) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.beacon;
    }

    /**
     * @notice The current dutch auction price of a parcel.
     */
    function requiredBid() external view returns (uint256) {
        return LibPCOLicenseClaimer._requiredBid();
    }

    /**
     * @notice Get beacon proxy for license
     * @param licenseId License ID
     */
    function getBeaconProxy(uint256 licenseId) external view returns (address) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();
        return ds.beaconProxies[licenseId];
    }

    /**
     * @notice Get the next proxy address for user. To be used to grant permissions before calling claim
     * @param user User address
     */
    function getNextProxyAddress(address user) public view returns (address) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                address(this),
                                keccak256(
                                    abi.encodePacked(user, ds.userSalts[user])
                                ),
                                keccak256(
                                    abi.encodePacked(
                                        type(BeaconDiamond).creationCode,
                                        abi.encode(
                                            address(this),
                                            IDiamondReadable(ds.beacon)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
    }

    /**
     * @notice Claim a new parcel and license
     *      - Must have ERC-20 approval of payment token
     *      - To-be-created contract must have create flow permissions for bidder. See getNextProxyAddress
     * @param initialContributionRate Initial contribution rate of parcel
     * @param initialForSalePrice Initial for sale price of parcel
     * @param baseCoordinate Base coordinate of new parcel
     * @param path Path of new parcel
     */
    function claim(
        int96 initialContributionRate,
        uint256 initialForSalePrice,
        uint64 baseCoordinate,
        uint256[] memory path
    ) external {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();
        LibPCOLicenseParams.DiamondStorage storage ls = LibPCOLicenseParams
            .diamondStorage();

        uint256 _requiredBid = LibPCOLicenseClaimer._requiredBid();
        require(
            initialForSalePrice >= _requiredBid,
            "PCOLicenseClaimerFacet: Initial for sale price does not meet requirement"
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

        emit ParcelClaimed(licenseId, msg.sender);

        // Build and mint
        _buildAndMint(msg.sender, baseCoordinate, path);

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
        ICFABasePCO(address(proxy)).initializeBid(
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
     * @param baseCoordinate Base coordinate of parcel to claim
     * @param path Path of parcel to claim
     */
    function _buildAndMint(
        address user,
        uint64 baseCoordinate,
        uint256[] memory path
    ) internal {
        uint256 licenseId = LibGeoWebParcel.nextId();
        LibGeoWebParcel.build(baseCoordinate, path);
        _safeMint(user, licenseId);
    }
}

contract PCOLicenseClaimerFacetV2 is
    PCOLicenseClaimerFacetV1,
    IPCOLicenseClaimerV2
{
    using SafeERC20 for ISuperToken;

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
        ICFABasePCO(address(proxy)).initializeBid(
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
    ) internal {
        uint256 licenseId = LibGeoWebParcel.nextId();
        LibGeoWebParcelV2.build(parcel);
        _safeMint(user, licenseId);
    }
}
