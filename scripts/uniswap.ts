import hre, {ethers} from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const AddressWithUsdcAndDai = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    
    const UsdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DaiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    await helpers.impersonateAccount(AddressWithUsdcAndDai);
    const impersonatedAccount = await ethers.getSigner(AddressWithUsdcAndDai);

    const UsdcContract = await ethers.getContractAt("IERC20", UsdcAddress);
    const DaiContract = await ethers.getContractAt("IERC20", DaiAddress);

    const UniRouterContract = await ethers.getContractAt("IUniswap1", UNIRouter)

    let usdcBal = await UsdcContract.balanceOf(impersonatedAccount.address);
    let daiBal = await DaiContract.balanceOf(impersonatedAccount.address);
    
    console.log("Usdc bal : ", ethers.formatUnits(usdcBal, 6));
    console.log("Dai Bal: ", ethers.formatUnits(daiBal, 18) );

     console.log("----------------Approving USDC and DAI for the router-----------------");

    let AmountA = ethers.parseUnits("200000", 6);
    let AmountB = ethers.parseUnits("200000", 18);

    let AmountAMin = ethers.parseUnits("190000", 6);
    let AmountBMin = ethers.parseUnits("190000", 18);

    let deadline = await helpers.time.latest() + 600;

    await UsdcContract.connect(impersonatedAccount).approve(UniRouterContract, AmountA);
    await DaiContract.connect(impersonatedAccount).approve(UniRouterContract, AmountB);

    const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const factoryAbi = [ "function getPair(address tokenA, address tokenB) external view returns (address pair)" ];

    const factoryContract = await ethers.getContractAt(factoryAbi, factoryAddress);

    const pairAddress = await factoryContract.getPair(UsdcAddress, DaiAddress);
    console.log("Pair address (LP token):", pairAddress);

    const lpToken = await ethers.getContractAt("IERC20", pairAddress);

    console.log("------------------Approval Done -----------------");




    console.log("----------------Adding Liquidity-----------------");

    const balanceBefore = await lpToken.balanceOf(impersonatedAccount.address);
    await UniRouterContract.connect(impersonatedAccount).addLiquidity(
        UsdcAddress,
        DaiAddress,
        AmountA, 
        AmountB,
        AmountAMin,
        AmountBMin,
        impersonatedAccount.address,
        deadline        
    )

    console.log("Liquidity Added Successfully");

    let usdcBalAfter = await UsdcContract.balanceOf(impersonatedAccount.address);
    let daiBalAfter = await DaiContract.balanceOf(impersonatedAccount.address);

    console.log('impersonneted acct usdc bal BA:', ethers.formatUnits(usdcBalAfter, 6))


    

    console.log("----------------Add Liquidity Eth-----------------");

    const AmountEthMin = ethers.parseUnits("0.95", 18);
    const ethToSend = ethers.parseEther("1.0"); 

    const tokenAmountDesired = await UniRouterContract.quote(
    ethers.parseEther("1"), 
    UsdcAddress,            
    DaiAddress             
    );

    const approveTx = await UsdcContract.connect(impersonatedAccount).approve(UNIRouter, AmountA);
    
    await UniRouterContract.connect(impersonatedAccount).addLiquidityETH(
        UsdcAddress,
        tokenAmountDesired,
        0,
        0,
        impersonatedAccount.address,
        deadline,
        { value: ethToSend }
    )


    await approveTx.wait();
    console.log("Approved Block Hash: ", approveTx.blockHash);


    

    console.log("----------------Getting Liquidity Value-----------------");

    const balanceAfter = await lpToken.balanceOf(impersonatedAccount.address);
    const liquidityMinted = balanceAfter - balanceBefore;

    console.log("Liquidity tokens minted:", ethers.formatUnits(liquidityMinted, 18));




    console.log("----------------remove liquidity function-----------------");

    const liquidityBalance = await lpToken.balanceOf(impersonatedAccount.address);
    await lpToken.connect(impersonatedAccount).approve(UNIRouter, liquidityBalance);

    await UniRouterContract.connect(impersonatedAccount).removeLiquidity(
        UsdcAddress,
        DaiAddress,
        liquidityBalance,
        0,
        0,
        impersonatedAccount.address,
        deadline
    )

    let usdcBalAfterLiquidity = await UsdcContract.balanceOf(impersonatedAccount.address);
    let daiBalAfterLiquidity = await DaiContract.balanceOf(impersonatedAccount.address);

    console.log("Usdc Bal after removal: ", ethers.formatUnits(usdcBalAfterLiquidity, 6))
    console.log("Dai Bal after removal: ", ethers.formatUnits(daiBalAfterLiquidity, 18))

}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1;
})