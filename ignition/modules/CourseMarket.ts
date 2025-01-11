// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CourseMarketModule = buildModule("CourseMarketModule", (m) => {
  const courseMarket = m.contract("CourseMarket");

  return { courseMarket };
});

export default CourseMarketModule;
