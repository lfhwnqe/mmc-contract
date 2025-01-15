import { ethers } from "hardhat";

async function main() {
  console.log("开始本地调试...");
  // 获取账户
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("使用账户:", {
    owner: owner.address,
    user1: user1.address,
    user2: user2.address,
  });
  // 部署 MMCERC721Coin
  console.log("\n部署 MMCERC721Coin...");
  const MMCERC721Coin = await ethers.getContractFactory("MMCERC721Coin");
  const mmcNFT = await MMCERC721Coin.deploy("MMC Course NFT", "MMCNFT");
  await mmcNFT.waitForDeployment();
  console.log("MMCERC721Coin 地址:", await mmcNFT.getAddress());

  // 测试 NFT 铸造
  console.log("\n测试 NFT 操作...");

  // 给 owner 铸造 NFT
  console.log("给 owner 铸造 NFT...");
  const ownerMintTx = await mmcNFT.safeMint(
    owner.address,
    "ipfs://QmTest/owner.json"
  );
  await ownerMintTx.wait();

  // 给 user1 铸造 NFT
  console.log("给 user1 铸造 NFT...");
  const user1MintTx = await mmcNFT.safeMint(
    user1.address,
    "ipfs://QmTest/user1.json"
  );
  await user1MintTx.wait();

  // 检查 NFT 状态
  console.log("\nNFT 状态:");
  const totalSupply = await mmcNFT.totalSupply();
  console.log("- 总供应量:", totalSupply.toString());

  // 检查 owner 的 NFT
  const ownerBalance = await mmcNFT.balanceOf(owner.address);
  console.log("- Owner NFT 数量:", ownerBalance.toString());
  if (ownerBalance > 0) {
    const ownerTokenId = await mmcNFT.tokenOfOwnerByIndex(owner.address, 0);
    const ownerTokenURI = await mmcNFT.tokenURI(ownerTokenId);
    console.log("  Token ID:", ownerTokenId.toString());
    console.log("  Token URI:", ownerTokenURI);
  }

  // 检查 user1 的 NFT
  const user1Balance = await mmcNFT.balanceOf(user1.address);
  console.log("- User1 NFT 数量:", user1Balance.toString());
  if (user1Balance > 0) {
    const user1TokenId = await mmcNFT.tokenOfOwnerByIndex(user1.address, 0);
    const user1TokenURI = await mmcNFT.tokenURI(user1TokenId);
    console.log("  Token ID:", user1TokenId.toString());
    console.log("  Token URI:", user1TokenURI);
  }

  // 测试转移 NFT
  console.log("\n测试 NFT 转移...");
  if (ownerBalance > 0) {
    const tokenId = await mmcNFT.tokenOfOwnerByIndex(owner.address, 0);
    console.log("转移 Token ID:", tokenId.toString(), "从 owner 到 user2");
    await mmcNFT.transferFrom(owner.address, user2.address, tokenId);

    // 验证转移结果
    const newOwner = await mmcNFT.ownerOf(tokenId);
    console.log("新的 Token 拥有者:", newOwner);
  }

  // 显示最终状态
  console.log("\n最终合约地址:");
  console.log("MMCERC721Coin:", await mmcNFT.getAddress());
}

main().catch((error) => {
  console.error("调试出错:", error);
  process.exitCode = 1;
});
