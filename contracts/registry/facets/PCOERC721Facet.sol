// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {LibDiamond} from "diamond-1-hardhat/contracts/libraries/LibDiamond.sol";
import "../libraries/LibPCOLicenseClaimer.sol";
import {ERC721Base, ERC721BaseInternal} from "@solidstate/contracts/token/ERC721/base/ERC721Base.sol";
import {ERC721Metadata} from "@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol";
import {ERC721MetadataStorage} from "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";
import {ERC165} from "@solidstate/contracts/introspection/ERC165.sol";
import {IERC165} from "@solidstate/contracts/interfaces/IERC165.sol";
import {IERC721} from "@solidstate/contracts/interfaces/IERC721.sol";
import {ERC165Storage} from "@solidstate/contracts/introspection/ERC165Storage.sol";

contract PCOERC721Facet is ERC721Base, ERC721Metadata, ERC165 {
    using ERC165Storage for ERC165Storage.Layout;

    function initializeERC721(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external {
        LibDiamond.enforceIsContractOwner();

        ERC721MetadataStorage.Layout storage ls = ERC721MetadataStorage
            .layout();
        ls.name = name;
        ls.symbol = symbol;
        ls.baseURI = baseURI;

        ERC165Storage.layout().setSupportedInterface(
            type(IERC165).interfaceId,
            true
        );
        ERC165Storage.layout().setSupportedInterface(
            type(IERC721).interfaceId,
            true
        );
    }

    /// @dev Override _isApprovedOrOwner to include corresponding beacon proxy
    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        virtual
        override
        returns (bool)
    {
        LibPCOLicenseClaimer.DiamondStorage storage cs = LibPCOLicenseClaimer
            .diamondStorage();

        return
            super._isApprovedOrOwner(spender, tokenId) ||
            spender == cs.beaconProxies[tokenId];
    }

    /**
     * @inheritdoc ERC721BaseInternal
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721BaseInternal, ERC721Metadata) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
