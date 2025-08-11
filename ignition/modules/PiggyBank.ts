import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const PiggyBankModule = buildModule("PiggyBankModule", (m) => {

    const piggyBank = m.contract("PiggyBankFactory")

    return { piggyBank }
})

export default PiggyBankModule;