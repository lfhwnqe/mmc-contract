// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MMCERC721Coin is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    mapping(address => bool) public minters;  // 使用映射来管理铸造权限

    // 铸造事件
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event MinterSet(address indexed minter, bool status);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    // 添加铸造者
    function setMinter(address minter, bool status) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        minters[minter] = status;
        emit MinterSet(minter, status);
    }

    // 修改铸造函数，只允许授权的铸造者调用
    function safeMint(address to, string memory uri) public returns (uint256) {
        require(minters[msg.sender], "Only authorized minters can mint NFTs");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    // 重写 tokenURI 函数
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // 重写必要的函数以解决继承冲突
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // 分页获取用户的 NFT
    function getUserNFTsByPage(address owner, uint256 page, uint256 pageSize) 
        public 
        view 
        returns (uint256[] memory tokenIds, string[] memory tokenURIs) 
    {
        uint256 balance = balanceOf(owner);
        uint256 start = page * pageSize;
        uint256 end = start + pageSize;
        
        // 确保不超出用户拥有的 NFT 数量
        if (start >= balance) {
            return (new uint256[](0), new string[](0));
        }
        if (end > balance) {
            end = balance;
        }
        
        uint256 length = end - start;
        tokenIds = new uint256[](length);
        tokenURIs = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, start + i);
            tokenIds[i] = tokenId;
            tokenURIs[i] = tokenURI(tokenId);
        }
        
        return (tokenIds, tokenURIs);
    }
}
