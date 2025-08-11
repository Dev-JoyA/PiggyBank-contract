//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PiggyBank.sol";

contract PiggyBankFactory {
    address[] public allBanks;
    mapping(address => address[]) public banksByOwner;

    event PiggyBankCreated (address indexed owner, address bankAddress);

    function createPiggyBank (uint _unLockTime) public{
        PiggyBank newBank = new PiggyBank(_unLockTime, msg.sender);
        address bankAddress = address(newBank);

        allBanks.push(bankAddress);
        banksByOwner[msg.sender] = allBanks;

        emit PiggyBankCreated (msg.sender, bankAddress);
    }

     function getAllBanks() public view returns (address[] memory) {
        return allBanks;
    }

    function getMyBanks() public view returns (address[] memory) {
        return banksByOwner[msg.sender];
    }

}
