import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  // Define the token and router addresses
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; 
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; 
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; 

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);
  console.log(`Impersonated account: ${impersonatedSigner.address}`);

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const WETH = await ethers.getContractAt("IERC20", wethAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2", UNIRouter);

  console.log("Getting Pair Address for Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(DAIAddress, wethAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  console.log("Getting Token Balance...");

  // Balance before removing liquidity
  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

  // Get liquidity balance (LP Token balance)
  const liquidityBF = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("Liquidity Token Balance Before Removal:", liquidityBF);

  console.log("Approving LP tokens to be burnt");

  await LPToken.connect(impersonatedSigner).approve(UNIRouter, liquidityBF);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; 

  // Execute the removeLiquidityETHSupportingFeeOnTransferTokens function
  const tx = await ROUTER.connect(impersonatedSigner).removeLiquidityETHSupportingFeeOnTransferTokens(
    DAIAddress,
    liquidityBF,
    0, // Minimum amount of DAI token
    0, // Minimum amount of ETH
    impersonatedSigner.address,
    deadline
  );

  await tx.wait();
  console.log("removeLiquidityETHSupportingFeeOnTransferTokens executed at", tx.hash);

  // Balance after removing liquidity
  const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

  console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
  console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));

  // Get liquidity balance after removal
  const liquidityAF = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("Liquidity Token Balance After Removal:", liquidityAF);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});