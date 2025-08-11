//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PiggyBank {
    uint256 public accountCount;
    uint256 public bankCount;
    uint public unLockTime;
    address public owner;

    constructor(uint _unlockTime, address _owner){
        require(block.timestamp < _unlockTime, "Unlockttime should be in the future");
        accountCount = 0;
        bankCount = 0;
        unLockTime = _unlockTime;
        owner = _owner;
    }

    enum Type {ERC20, ETH} 

    struct Account {
        uint256 id; 
        uint256 bankId; 
        address accountNumber;
        uint256 balance;
        Type paymentType;
    }

    enum Registration {Registered, NotRegistered}

    struct Bank {
        uint256 id; 
        address user;
        Registration registration;
    }

    mapping(address => uint256) public accountCounter;
    mapping(address => Account[]) public usersAccount;
    mapping(address => Bank) public bankAccount;

    error NotRegistered();

    event BankJoined(address indexed user, uint256 bankId);
    event AccountCreated(address indexed user, uint256 accountId, uint256 bankId);

    function joinBank() public {
        require(bankAccount[msg.sender].id == 0, "User already registered");

        bankCount++;
        bankAccount[msg.sender] = Bank ({
            id : bankCount,
            user : msg.sender,
            registration : Registration.Registered
        });

        emit BankJoined(msg.sender, bankCount);
    }

    function createAccount(uint256 _id, address _user, Type _paymentType) public {
        if (bankAccount[msg.sender].registration != Registration.Registered) {
            revert NotRegistered();
        }
        require(bankAccount[msg.sender].user != address(0), "Join bank before creating acount");

        accountCount++;
        _id = bankAccount[msg.sender].id;
        _user = bankAccount[msg.sender].user;

        Account memory newAccount = Account({
            id: accountCount,
            bankId: _id,
            accountNumber: _user,
            balance: 0,
            paymentType : _paymentType
        });

        accountCounter[_user] = accountCount;
        usersAccount[msg.sender].push(newAccount);

        emit AccountCreated(msg.sender, accountCount, bankAccount[msg.sender].id);
    }

    function deposit(uint256 _amount, address _user, uint256 _id, uint256 _accountId) public {
        require(bankAccount[msg.sender].user == _user, "No access to this account");
        require(bankAccount[msg.sender].id != 0, "No account created");
        require(bankAccount[msg.sender].id == _id, "This is not your bank account");
        require(usersAccount[msg.sender][_accountId].id != 0, "Account with that id does not exist");

        usersAccount[_user][_accountId].balance += _amount;
    }

      function withdrawal(uint256 _amount, address _user, uint256 _id, uint256 _accountId) public payable {
        require(bankAccount[msg.sender].user == _user, "No access to this account");
        require(bankAccount[msg.sender].id != 0, "No account created");
        require(bankAccount[msg.sender].id == _id, "This is not your bank account");
        require(usersAccount[msg.sender][_accountId].id != 0, "Account with that id does not exist");
        
        uint256 penalty = (_amount * 3) / 100;
        if(block.timestamp < unLockTime){
            require(usersAccount[_user][_accountId].balance >= _amount + penalty, "not enougth penalty amount");
            usersAccount[_user][_accountId].balance -= penalty;
            payable(owner).transfer(penalty);
             require(usersAccount[_user][_accountId].balance > _amount, "Not enough amount left to withdraw after penalty");
        }else {
            require(usersAccount[_user][_accountId].balance >= _amount, "Not enough balance");
        }
        usersAccount[_user][_accountId].balance -= _amount;

    }



    function allBalance() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < usersAccount[msg.sender].length; i++) {
            total += usersAccount[msg.sender][i].balance;
        }
        return total;
    }

    function totalAccountPerUser() public view returns (uint256) {
        return usersAccount[msg.sender].length;
    }
}