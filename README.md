# 🐷 PiggyBank & PiggyBankFactory Contracts

This project provides a smart contract system for creating and managing individual Piggy Banks with unlock times, owned by different users.  
The `PiggyBankFactory` contract enables users to deploy multiple PiggyBank instances, while each `PiggyBank` contract manages accounts, deposits, and withdrawals with penalties if withdrawn early.

---

## 📜 Contract Summary

### PiggyBankFactory

- Enables users to create multiple PiggyBank contracts with a specified unlock time.
- Tracks all deployed PiggyBanks and banks created per owner.
- Emits an event whenever a new PiggyBank is created.

### PiggyBank

- Manages bank accounts for an individual user with:
  - Account creation (linked to payment type: ERC20 or ETH).
  - Deposit and withdrawal functions.
  - Penalty applied if withdrawal happens before the unlock time (3% penalty transferred to the contract owner).
- Keeps track of balances and accounts per user.
- Emits events on bank joining and account creation.

---

## 🔧 Key Features

### PiggyBankFactory

- `createPiggyBank(uint _unlockTime)`  
  Deploys a new `PiggyBank` contract with the caller as owner and specified unlock time.

- `getAllBanks()`  
  Returns all deployed PiggyBank contract addresses.

- `getMyBanks()`  
  Returns all PiggyBank addresses created by the caller.

---

### PiggyBank

- **Join Bank**  
  Users call `joinBank()` to register themselves as a bank user (only once).

- **Create Account**  
  Registered users can create accounts with a payment type (ERC20 or ETH) by calling `createAccount()`.

- **Deposit**  
  Increase account balance by specifying amount and account info.

- **Withdrawal**  
  Withdraw funds from an account.  
  - If before unlock time, a 3% penalty is deducted and sent to the contract owner.  
  - Requires sufficient balance including penalty if applicable.

- **View Balances**  
  - `allBalance()` returns total balance across all user accounts.  
  - `totalAccountPerUser()` returns the number of accounts the user has.

---

## ✅ Validations & Access Control

- Users must `joinBank()` before creating accounts or transacting.
- Only registered users can create accounts and perform deposits/withdrawals.
- Withdrawal enforces penalty if performed before unlock time.
- Balances and accounts are tied to the user's wallet address.
- Prevents duplicate bank registrations.

---

## 🧩 Data Structures

```solidity
enum Type { ERC20, ETH }

struct Account {
    uint256 id;
    uint256 bankId;
    address accountNumber;
    uint256 balance;
    Type paymentType;
}

enum Registration { Registered, NotRegistered }

struct Bank {
    uint256 id;
    address user;
    Registration registration;
}

```

## 📍 Deployment Info

### PiggyBankFactory

**Transaction Hash:**  
```shell
0x3264e91304aAC26E3F0F870EAACBc1B1899a9Bf7
```

**Verified Contract Address:**  
[https://sepolia-blockscout.lisk.com/address/0x3264e91304aAC26E3F0F870EAACBc1B1899a9Bf7#code](https://sepolia-blockscout.lisk.com/address/0x3264e91304aAC26E3F0F870EAACBc1B1899a9Bf7#code)

*(PiggyBank contracts are deployed by the factory dynamically, so individual addresses are tracked within the factory state.)*

---

## 🔔 Events

- `PiggyBankCreated(address indexed owner, address bankAddress)`  
  Emitted when a new PiggyBank contract is created.

- `BankJoined(address indexed user, uint256 bankId)`  
  Emitted when a user joins a bank.

- `AccountCreated(address indexed user, uint256 accountId, uint256 bankId)`  
  Emitted when a new account is created.

