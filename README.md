# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

## dev
- start local hardhat node
    startup a local hardhat node for testing
```shell
pnpm node
```
- ether scan in devlopment
https://app.tryethernal.com/accounts
- compile
```shell
pnpm compile
```
- typechain
```shell
pnpm typechain
```
- test
```shell
pnpm test
```

## config

- set variables
```shell
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set TEST_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```
- get variables
```shell
npx hardhat vars list
npx hardhat vars get INFURA_API_KEY
```

## build

- set variables
```shell
$ npx hardhat vars set TEST_API_KEY
```
## verify
verify contract in etherscan

contract address:0xd4Ca987504bbAc09e6df1D4277c742cA43F044Ea
chain :sepolia
```shell
# mmcToken address
npx hardhat verify --network sepolia 0xd4Ca987504bbAc09e6df1D4277c742cA43F044Ea
# courseMarket need mmcToken address
npx hardhat verify --network sepolia 0x2738704a2A91f2C2724422540f7991Ed0D144b75 "0xd4Ca987504bbAc09e6df1D4277c742cA43F044Ea"
```