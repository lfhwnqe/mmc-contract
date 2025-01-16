import { ethers } from "hardhat";

async function main() {
  console.log("开始部署合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("使用地址部署:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");

  // 1. 部署 MMCToken
  console.log("\n部署 MMCToken...");
  const MMCToken = await ethers.getContractFactory("MMCToken");
  const mmcToken = await MMCToken.deploy();
  await mmcToken.waitForDeployment();

  console.log("MMCToken 部署成功！");
  console.log("合约地址:", await mmcToken.getAddress());

  // 等待确认
  console.log("\n等待区块确认...");
  const tokenReceipt = await mmcToken.deploymentTransaction()?.wait();
  console.log("部署交易已确认");
  console.log("- MMCToken 区块高度:", tokenReceipt?.blockNumber);

  // 验证 MMCToken 部署结果
  console.log("\nMMCToken 信息:");
  const tokenName = await mmcToken.name();
  const tokenSymbol = await mmcToken.symbol();
  const tokenSupply = await mmcToken.totalSupply();
  const tokenOwner = await mmcToken.owner();
  const maxSupply = await mmcToken.MAX_SUPPLY();
  const tokenPerEth = await mmcToken.TOKENS_PER_ETH();

  console.log("- 名称:", tokenName);
  console.log("- 符号:", tokenSymbol);
  console.log("- 当前供应量:", tokenSupply.toString(), "MMC");
  console.log("- 最大供应量:", maxSupply.toString(), "MMC");
  console.log("- 兑换比率: 1 ETH =", tokenPerEth.toString(), "MMC");
  console.log("- 所有者:", tokenOwner);

  // 执行初始代币分配
  console.log("\n执行 MMCToken 初始分配...");
  await mmcToken.distributeInitialTokens(
    deployer.address, // 团队钱包
    deployer.address, // 市场营销钱包
    deployer.address // 社区钱包
  );

  const tokenBalanceAfter = await mmcToken.balanceOf(deployer.address);
  console.log("- 初始分配后部署者余额:", tokenBalanceAfter.toString(), "MMC");

  // 2. 部署 MMCERC721Coin
  console.log("\n部署 MMCERC721Coin...");
  const MMCERC721Coin = await ethers.getContractFactory("MMCERC721Coin");
  const mmcNFT = await MMCERC721Coin.deploy("MMC Course NFT", "MMCNFT");
  await mmcNFT.waitForDeployment();

  console.log("MMCERC721Coin 部署成功！");
  console.log("合约地址:", await mmcNFT.getAddress());

  // 等待确认
  console.log("\n等待区块确认...");
  const nftReceipt = await mmcNFT.deploymentTransaction()?.wait();
  console.log("部署交易已确认");
  console.log("- MMCERC721Coin 区块高度:", nftReceipt?.blockNumber);

  // 验证 NFT 合约信息
  console.log("\nMMCERC721Coin 信息:");
  const nftName = await mmcNFT.name();
  const nftSymbol = await mmcNFT.symbol();
  console.log("- 名称:", nftName);
  console.log("- 符号:", nftSymbol);

  // 3. 部署 CourseMarket
  console.log("\n部署 CourseMarket...");
  const CourseMarket = await ethers.getContractFactory("CourseMarket");
  const courseMarket = await CourseMarket.deploy(
    await mmcToken.getAddress(),
    await mmcNFT.getAddress(),
    deployer.address
  );
  await courseMarket.waitForDeployment();

  console.log("CourseMarket 部署成功！");
  console.log("合约地址:", await courseMarket.getAddress());

  // 等待确认
  console.log("\n等待区块确认...");
  const marketReceipt = await courseMarket.deploymentTransaction()?.wait();
  console.log("部署交易已确认");
  console.log("- CourseMarket 区块高度:", marketReceipt?.blockNumber);

  // 4. 设置 CourseMarket 为授权铸造者
  await mmcNFT.setMinter(await courseMarket.getAddress(), true);

  // 添加测试课程
  console.log("\n添加测试课程...");

  // 添加第一个测试课程
  await courseMarket.addCourse(
    "COURSE-001",
    "初级英语会话课程",
    10,
    "https://gateway.pinata.cloud/ipfs/bafkreia7eliuw4pll5y4afkqwwwatoxmbvvyudz4hmvym7rxopkp36pww4" // 添加元数据 URI
  );
  console.log("- 测试课程1添加成功");

  // 添加第二个测试课程
  await courseMarket.addCourse(
    "COURSE-002",
    "商务英语进阶课程",
    20,
    "https://gateway.pinata.cloud/ipfs/bafkreia7eliuw4pll5y4afkqwwwatoxmbvvyudz4hmvym7rxopkp36pww4" // 添加元数据 URI
  );
  console.log("- 测试课程2添加成功");

  // 验证课程添加结果
  const courseCount = await courseMarket.courseCount();
  console.log("\n课程市场信息:");
  console.log("- 总课程数:", courseCount.toString());

  // 获取并显示课程详情
  for (let i = 1; i <= courseCount; i++) {
    const course = await courseMarket.courses(i);
    console.log(`\n课程 ${i} 详情:`);
    console.log("- ID:", course.web2CourseId);
    console.log("- 名称:", course.name);
    console.log("- 价格:", course.price.toString(), "MMC");
    console.log("- 创建者:", course.creator);
    console.log("- 元数据 URI:", course.metadataURI);
  }

  // 测试课程购买和完成流程
  console.log("\n测试课程购买和完成流程...");

  // 1. 创建测试用户
  const [_, testUser] = await ethers.getSigners();
  console.log("测试用户地址:", testUser.address);

  // 2. 转移一些代币给测试用户
  await mmcToken.transfer(testUser.address, 100);
  console.log("转移 100 MMC 给测试用户");

  // 3. 测试用户授权 CourseMarket 合约
  const mmcTokenUser = mmcToken.connect(testUser);
  await mmcTokenUser.approve(await courseMarket.getAddress(), 100);
  console.log("测试用户授权 CourseMarket 合约");

  // 4. 测试用户购买课程
  const courseMarketUser = courseMarket.connect(testUser);
  await courseMarketUser.purchaseCourse("COURSE-001");
  console.log("测试用户购买课程 COURSE-001");

  // 5. Oracle（deployer）调用完成课程
  await courseMarket.completeCourse(testUser.address, "COURSE-001");
  console.log("Oracle 标记课程完成");

  // 6. 验证 NFT 铸造结果
  const nftBalance = await mmcNFT.balanceOf(testUser.address);
  console.log("\nNFT 铸造结果:");
  console.log("- 用户 NFT 数量:", nftBalance.toString());

  if (nftBalance > 0) {
    const tokenId = await mmcNFT.tokenOfOwnerByIndex(testUser.address, 0);
    const tokenURI = await mmcNFT.tokenURI(tokenId);
    console.log("- NFT Token ID:", tokenId.toString());
    console.log("- NFT Token URI:", tokenURI);
  }

  // 显示所有合约地址
  console.log("\n所有合约部署完成！");
  console.log("MMCToken:", await mmcToken.getAddress());
  console.log("MMCERC721Coin:", await mmcNFT.getAddress());
  console.log("CourseMarket:", await courseMarket.getAddress());
}

// 运行部署脚本
main().catch((error) => {
  console.error("部署出错：", error);
  process.exitCode = 1;
});
