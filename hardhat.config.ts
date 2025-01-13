import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("hardhat-ethernal");
require("@nomicfoundation/hardhat-verify");

import { vars } from "hardhat/config";

const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const accounts = vars.has("TEST_API_KEY") ? [vars.get("TEST_API_KEY")] : [];
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};
export default config;