// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MMCTokenModule = buildModule("MMCTokenModule", (m) => {
  const mmcToken = m.contract("MMCToken");

  return { mmcToken };
});

export default MMCTokenModule;
