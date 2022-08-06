// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibPCOLicenseClaimer.sol";
import "../libraries/LibPCOLicenseParams.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "../../pco-license/facets/CFABasePCOFacet.sol";
import "../interfaces/IPCOLicenseParamsStore.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract PCOLicenseClaimerFacet {
    /// @notice Emitted when a parcel is claimed
    event ParcelClaimed(uint256 indexed _licenseId, address indexed _payer);

    /**
     * @notice The current dutch auction price of a parcel.
     */
    function requiredBid() internal view returns (uint256) {
        return LibPCOLicenseClaimer._requiredBid();
    }

    /**
     * @notice Get the next proxy address for user. To be used to grant permissions before calling claim
     */
    function getNextProxyAddress(address user) internal view returns (address) {
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
                                bytes32(ds.userSalts[user]),
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
            salt: bytes32(ds.userSalts[msg.sender])
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
