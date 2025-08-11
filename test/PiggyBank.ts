import {time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import hre , {ethers} from "hardhat"
import { expect } from "chai";



describe("PiggyBank", function() {
    async function deployPiggyBank() {

        const piggyBank = await ethers.getContractFactory("PiggyBankFactory");
        const PiggyBank = await piggyBank.deploy();
        await PiggyBank.waitForDeployment();

        return {PiggyBank}
    }

    describe("Deployment", function () {
        it("should deploy the contract", async function (){
            const { PiggyBank } = await loadFixture(deployPiggyBank);

            expect(await PiggyBank.getAddress()).to.properAddress;
        })
    })

    describe("createPiggyBank", function () {
        it("should create new piggy bank") , async function() {
            const { PiggyBank } = await loadFixture(deployPiggyBank);

            const unlockTime = (await time.latest()) + 200;

            await PiggyBank.createPiggyBank(unlockTime);

            const allBanks = await PiggyBank.getAllBanks();

            expect(allBanks.length).to.equal(1);

            expect(allBanks[0]).to.properAddress;
        }
    })

    
})