import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY =vars.get("PRIVATE_KEY") ;
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");


const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    hardhat: {},
    "lisk-sepolia" : {
      url : "https://rpc.sepolia-api.lisk.com",
      chainId : 4202,
      accounts : [PRIVATE_KEY]
    }
  },

  etherscan : {
    apiKey: {
      "lisk-sepolia" : ETHERSCAN_API_KEY
    },

    customChains : [
      {
        network : "lisk-sepolia",
        chainId : 4202,
        urls : {
          apiURL : "https://sepolia-blockscout.lisk.com/api",
          browserURL : "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  }
};

export default config;