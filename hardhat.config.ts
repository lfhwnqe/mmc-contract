import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("hardhat-ethernal");
import { vars } from "hardhat/config";

const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const salt = vars.get("DEPLOY_SALT", "12345");
const accounts = vars.has("TEST_API_KEY") ? [vars.get("TEST_API_KEY")] : [];
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts,
    },
  },
};

export default config;
