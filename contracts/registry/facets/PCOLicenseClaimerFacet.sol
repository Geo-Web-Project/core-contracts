// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibPCOLicenseClaimer.sol";
import "../libraries/LibPCOLicenseParams.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "../../pco-license/facets/CFABasePCOFacet.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";

contract PCOLicenseClaimerFacet {
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice Initialize.
     *      - Must be the contract owner
     * @param auctionStart start time of the genesis land parcel auction.
     * @param auctionEnd when the required bid amount reaches its minimum value.
     * @param startingBid start price of the genesis land auction. Decreases to endingBid between auctionStart and auctionEnd.
     * @param endingBid the final/minimum required bid reached and maintained at the end of the auction.
     * @param beacon The beacon contract for PCO licenses
     */
    function initialize(
        uint256 auctionStart,
        uint256 auctionEnd,
        uint256 startingBid,
        uint256 endingBid,
        IBeacon beacon
    ) external {
        LibDiamond.enforceIsContractOwner();

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
     * @param _startingBid The new starting bid
     */
    function setStartingBid(uint256 _startingBid) external {
        LibDiamond.enforceIsContractOwner();
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.startingBid = _startingBid;
    }

    /// @notice Starting bid
    function getStartingBid() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.startingBid;
    }

    /**
     * @notice Admin can update the ending bid.
     * @param _endingBid The new ending bid
     */
    function setEndingBid(uint256 _endingBid) external {
        LibDiamond.enforceIsContractOwner();
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.endingBid = _endingBid;
    }

    /// @notice Ending bid
    function getEndingBid() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.endingBid;
    }

    /**
     * @notice Admin can update the start time of the initial Dutch auction.
     * @param _auctionStart The new start time of the initial Dutch auction
     */
    function setAuctionStart(uint256 _auctionStart) external {
        LibDiamond.enforceIsContractOwner();
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.auctionStart = _auctionStart;
    }

    /// @notice Auction start
    function getAuctionStart() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.auctionStart;
    }

    /**
     * @notice Admin can update the end time of the initial Dutch auction.
     * @param _auctionEnd The new end time of the initial Dutch auction
     */
    function setAuctionEnd(uint256 _auctionEnd) external {
        LibDiamond.enforceIsContractOwner();
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.auctionEnd = _auctionEnd;
    }

    /// @notice Auction end
    function getAuctionEnd() external view returns (uint256) {
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        return ds.auctionEnd;
    }

    /**
     * @notice Admin can update the beacon contract
     * @param _beacon The new end time of the initial Dutch auction
     */
    function setBeacon(IBeacon _beacon) external {
        LibDiamond.enforceIsContractOwner();
        LibPCOLicenseClaimer.DiamondStorage storage ds = LibPCOLicenseClaimer
            .diamondStorage();

        ds.beacon = _beacon;
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
    function getNextProxyAddress(address user) external view returns (address) {
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
                                        type(BeaconProxy).creationCode,
                                        abi.encode(
                                            address(ds.beacon),
                                            new bytes(0)
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

        if (block.timestamp <= ds.auctionEnd) {
            // Transfer initial payment
            bool success = ls.paymentToken.transferFrom(
                msg.sender,
                ls.beneficiary,
                initialForSalePrice
            );
            require(
                success,
                "PCOLicenseClaimerFacet: Initial claim payment failed"
            );
        }

        uint256 licenseId = LibPCOLicenseClaimer._buildAndMint(
            msg.sender,
            baseCoordinate,
            path
        );

        BeaconProxy proxy = new BeaconProxy{
            salt: keccak256(
                abi.encodePacked(msg.sender, ds.userSalts[msg.sender])
            )
        }(address(ds.beacon), new bytes(0));

        // Increment user salt
        ds.userSalts[msg.sender] += 1;

        // Store beacon proxy
        ds.beaconProxies[licenseId] = address(proxy);

        // Initialize beacon
        CFABasePCOFacet(address(proxy)).initializeBid(
            IPCOLicenseParamsStore(address(this)),
            IERC721(address(this)),
            licenseId,
            msg.sender,
            initialContributionRate,
            initialForSalePrice
        );

        emit ParcelClaimed(licenseId, msg.sender);
    }
}
