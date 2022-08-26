// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../libraries/LibERC721.sol";
import "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract ERC721Facet is IERC721, ERC165, IERC721Metadata, Context {
    function initialize(string calldata _name, string calldata _symbol)
        external
    {
        LibDiamond.enforceIsContractOwner();

        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();

        ds.name = _name;
        ds.symbol = _symbol;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) external view override returns (uint256) {
        require(
            owner != address(0),
            "ERC721: address zero is not a valid owner"
        );
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        return ds.balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) external view override returns (address) {
        return LibERC721.ownerOf(tokenId);
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() external view override returns (string memory) {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();

        return ds.name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() external view override returns (string memory) {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();

        return ds.symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        LibERC721._requireMinted(tokenId);

        return "";
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) external override {
        address owner = LibERC721.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not token owner nor approved for all"
        );

        LibERC721._approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId)
        external
        view
        override
        returns (address)
    {
        return LibERC721.getApproved(tokenId);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved)
        external
        override
    {
        LibERC721._setApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        return LibERC721.isApprovedForAll(owner, operator);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        //solhint-disable-next-line max-line-length
        require(
            LibERC721._isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner nor approved"
        );

        LibERC721._transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        require(
            LibERC721._isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner nor approved"
        );
        LibERC721._safeTransfer(from, to, tokenId, data);
    }
}
