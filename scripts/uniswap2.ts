import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, {ethers} from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const AddressWithWeth = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    
    const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const DaiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const UNIRouter = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

    await helpers.impersonateAccount(AddressWithWeth);
    const impersonatedAccount = await ethers.getSigner(AddressWithWeth);

    const WethContract = await ethers.getContractAt("IERC20", WethAddress);
    const DaiContract = await ethers.getContractAt("IERC20", DaiAddress);

    const UniRouterContract = await ethers.getContractAt("IUniswap1", UNIRouter);
    const UniRouterContract2 = await ethers.getContractAt("IUniswap2", UNIRouter);

    let WethBal = await WethContract.balanceOf(impersonatedAccount.address);
    let DaiBal = await DaiContract.balanceOf(impersonatedAccount.address);

    console.log("Weth Bal: ", ethers.formatUnits(WethBal, 18))
    console.log("Dai Bal: ", ethers.formatUnits(DaiBal, 18))

    const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const factoryAbi = [ "function getPair(address tokenA, address tokenB) external view returns (address pair)" ];

    const factoryContract = await ethers.getContractAt(factoryAbi, factoryAddress);

    const pairAddress = await factoryContract.getPair(WethAddress, DaiAddress);
    console.log("pair Address : ", pairAddress)

    console.log("----------------Approving Weth and dai for the router-----------------");


    const pairAbi = [
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() external view returns (address)"
    ];
    const pairContract = await ethers.getContractAt(pairAbi, pairAddress);
    
    const [reserve0, reserve1] = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    
    const isWethToken0 = token0.toLowerCase() === WethAddress.toLowerCase();
    const wethReserve = isWethToken0 ? reserve0 : reserve1;
    const daiReserve = isWethToken0 ? reserve1 : reserve0;
    
    console.log("Current reserves:");
    console.log("WETH:", ethers.formatUnits(wethReserve, 18));
    console.log("DAI:", ethers.formatUnits(daiReserve, 18));
    
    const currentRatio = Number(ethers.formatUnits(daiReserve, 18)) / Number(ethers.formatUnits(wethReserve, 18));
    console.log("Current DAI/WETH ratio:", currentRatio);

    const wethToDeposit = ethers.parseUnits("0.5", 18);
    const daiToDeposit = ethers.parseUnits((currentRatio * 0.5).toFixed(0), 18); // Rounded to whole DAI
    
    const wethMin = wethToDeposit * 95n / 100n;
    const daiMin = daiToDeposit * 95n / 100n;
    
    const deadline = Math.floor(Date.now() / 1000) + 600; 

    console.log("----------------Approving Tokens-----------------");
    console.log(`Approving ${ethers.formatUnits(wethToDeposit, 18)} WETH`);
    const approveWethTx = await WethContract.connect(impersonatedAccount).approve(UNIRouter, wethToDeposit);
    await approveWethTx.wait();
    
    console.log(`Approving ${ethers.formatUnits(daiToDeposit, 18)} DAI`);
    const approveDaiTx = await DaiContract.connect(impersonatedAccount).approve(UNIRouter, daiToDeposit);
    await approveDaiTx.wait();

    console.log("----------------Adding Liquidity-----------------");
    const lpToken = await ethers.getContractAt("IERC20", pairAddress);
    const balanceBefore = await lpToken.balanceOf(impersonatedAccount.address);
    console.log("LP Balance Before:", ethers.formatUnits(balanceBefore, 18));

    try {
        console.log(`Adding liquidity with:
          WETH: ${ethers.formatUnits(wethToDeposit, 18)}
          DAI: ${ethers.formatUnits(daiToDeposit, 18)}
          Min WETH: ${ethers.formatUnits(wethMin, 18)}
          Min DAI: ${ethers.formatUnits(daiMin, 18)}`);

        const tx = await UniRouterContract.connect(impersonatedAccount).addLiquidity(
            WethAddress,
            DaiAddress,
            wethToDeposit,
            daiToDeposit,
            wethMin,
            daiMin,
            impersonatedAccount.address,
            deadline,
            { gasLimit: 500000 } 
        );
        
       const receipt = await tx.wait();
        
    } catch (error) {
        console.error("Failed to add liquidity:", error);
        if (error) {
            console.log("Revert reason:", error);
        }
    
    }

     
        
        const balanceAfter = await lpToken.balanceOf(impersonatedAccount.address);
        const liquidityAdded = balanceAfter - balanceBefore;
        console.log("LP Tokens Received:", liquidityAdded);

    console.log("----------------Getting liquidity Value-----------------");
console.log("----------------Removing Liquidity-----------------");

// Get current reserves again to calculate expected amounts
const [reserve2, reserve3] = await pairContract.getReserves();
const currentWethReserve = isWethToken0 ? reserve0 : reserve1;
const currentDaiReserve = isWethToken0 ? reserve1 : reserve0;
const totalSupply = await lpToken.totalSupply();

// Calculate expected amounts
const expectedEth = (liquidityAdded * currentWethReserve) / totalSupply;
const expectedDai = (liquidityAdded * currentDaiReserve) / totalSupply;

console.log("Expected ETH from removal:", ethers.formatUnits(expectedEth, 18));
console.log("Expected DAI from removal:", ethers.formatUnits(expectedDai, 18));

// Set minimum amounts with 5% slippage tolerance
const ethMin = expectedEth * 95n / 100n;
const daiMinn = expectedDai * 95n / 100n;

console.log(`Removing ${ethers.formatUnits(liquidityAdded, 18)} LP tokens`);
console.log(`Minimum ETH to accept: ${ethers.formatUnits(ethMin, 18)}`);
console.log(`Minimum DAI to accept: ${ethers.formatUnits(daiMin, 18)}`);

try {
    const tx2 = await UniRouterContract2.connect(impersonatedAccount).removeLiquidityETHSupportingFeeOnTransferTokens(
        DaiAddress,          // The non-ETH token (DAI)
        liquidityAdded,      // Amount of LP tokens to burn
        daiMinn,              // Minimum DAI to receive (with slippage)
        ethMin,             // Minimum ETH to receive (with slippage)
        impersonatedAccount.address,  // Recipient
        deadline,            // Deadline
        { gasLimit: 500000 } // Gas limit
    );

    const receipt = await tx2.wait();
    console.log("Liquidity removed successfully! Tx hash:", );

    // Check final balances
    const finalWethBal = await WethContract.balanceOf(impersonatedAccount.address);
    const finalDaiBal = await DaiContract.balanceOf(impersonatedAccount.address);
    const finalEthBal = await ethers.provider.getBalance(impersonatedAccount.address);
    
    console.log("Final balances:");
    console.log("WETH:", ethers.formatUnits(finalWethBal, 18));
    console.log("DAI:", ethers.formatUnits(finalDaiBal, 18));
    console.log("ETH:", ethers.formatUnits(finalEthBal, 18));

} catch (error) {
    console.error("Failed to remove liquidity:", error);
    if (error) {
        console.log("Revert reason:", error);
    }
    if (error) {
        console.log("Failed tx hash:", error);
    }
}









}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1
})