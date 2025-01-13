import { ethers } from "hardhat";

async function main() {
  console.log("开始部署合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("使用地址部署:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");

  // 部署 MMCToken
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

  // 部署 CourseMarket
  console.log("\n部署 CourseMarket...");
  const CourseMarket = await ethers.getContractFactory("CourseMarket");
  const courseMarket = await CourseMarket.deploy(await mmcToken.getAddress());
  await courseMarket.waitForDeployment();

  console.log("CourseMarket 部署成功！");
  console.log("合约地址:", await courseMarket.getAddress());

  // 等待确认
  console.log("\n等待区块确认...");
  const marketReceipt = await courseMarket.deploymentTransaction()?.wait();
  console.log("部署交易已确认");
  console.log("- CourseMarket 区块高度:", marketReceipt?.blockNumber);

  // 添加测试课程
  console.log("\n添加测试课程...");

  // 添加第一个测试课程
  await courseMarket.addCourse(
    "COURSE-001",
    "初级英语会话课程",
    10 // 直接使用整数，不用 parseEther
  );
  console.log("- 测试课程1添加成功");

  // 添加第二个测试课程
  await courseMarket.addCourse("COURSE-002", "商务英语进阶课程", 20);
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
  }

  console.log("\n所有合约部署完成！");
  console.log("MMCToken:", await mmcToken.getAddress());
  console.log("CourseMarket:", await courseMarket.getAddress());
}

// 运行部署脚本
main().catch((error) => {
  console.error("部署出错：", error);
  process.exitCode = 1;
});
