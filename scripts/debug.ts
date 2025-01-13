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

  // 1. 部署 MMC 代币
  console.log("\n部署 MMC 代币...");
  const MMCToken = await ethers.getContractFactory("MMCToken");
  const mmcToken = await MMCToken.deploy();
  await mmcToken.waitForDeployment();
  console.log("MMC Token 地址:", await mmcToken.getAddress());

  // 2. 初始化代币分配
  console.log("\n初始化代币分配...");
  await mmcToken.distributeInitialTokens(
    owner.address,
    owner.address,
    owner.address
  );

  // 打印初始余额
  const ownerBalance = await mmcToken.balanceOf(owner.address);
  console.log("Owner 初始余额:", ownerBalance.toString());

  // 3. 部署 CourseMarket
  console.log("\n部署 CourseMarket...");
  const CourseMarket = await ethers.getContractFactory("CourseMarket");
  const courseMarket = await CourseMarket.deploy(await mmcToken.getAddress());
  await courseMarket.waitForDeployment();
  console.log("CourseMarket 地址:", await courseMarket.getAddress());

  // 4. 添加测试课程
  console.log("\n添加测试课程...");
  await courseMarket.addCourse(
    "COURSE-001",
    "测试课程1",
    10 // 10 MMC，不使用 parseEther
  );
  await courseMarket.addCourse(
    "COURSE-002",
    "测试课程2",
    20 // 20 MMC，不使用 parseEther
  );

  // 5. 转移一些代币给测试用户
  console.log("\n转移代币给测试用户...");
  await mmcToken.transfer(user1.address, 100); // 给 user1 100 MMC
  await mmcToken.transfer(user2.address, 100); // 给 user2 100 MMC

  // 6. 测试购买课程
  console.log("\n测试购买课程...");
  // 使用 user1 购买课程
  const mmcTokenUser1 = mmcToken.connect(user1);
  const courseMarketUser1 = courseMarket.connect(user1);

  console.log("授权代币...");
  await mmcTokenUser1.approve(
    await courseMarket.getAddress(),
    10 // 授权 10 MMC
  );

  console.log("购买课程...");
  await courseMarketUser1.purchaseCourse("COURSE-001");

  // 7. 打印状态
  console.log("\n最终状态:");
  const course = await courseMarket.courses(1);
  console.log("课程信息:", {
    web2CourseId: course.web2CourseId,
    name: course.name,
    price: course.price.toString(),
    isActive: course.isActive,
    creator: course.creator,
  });

  const user1Balance = await mmcToken.balanceOf(user1.address);
  console.log("User1 MMC 余额:", user1Balance.toString());

  const hasCourse = await courseMarket.hasCourse(user1.address, "COURSE-001");
  console.log("User1 是否拥有课程:", hasCourse);

  console.log("\n调试完成！");
  console.log("MMC Token:", await mmcToken.getAddress());
  console.log("CourseMarket:", await courseMarket.getAddress());
}

main().catch((error) => {
  console.error("调试出错:", error);
  process.exitCode = 1;
}); 