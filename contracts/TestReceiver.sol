pragma solidity ^0.7.0;

import "./WrappedDeposit.sol";

contract TestReceiver is ERC20Receiver, EtherReceiver {
  mapping (address => uint) testTokenBalances;
  mapping (address => uint) etherBalances;
  address immutable WRAPPED_DEPOSIT;
  address immutable TEST_TOKEN;

  constructor(address wrappedDeposit, address testToken) {
    WRAPPED_DEPOSIT = wrappedDeposit;
    TEST_TOKEN = testToken;
  }

  function acceptERC20Deposit(address depositor, address token, uint amount) public override returns (bool) {
    require(msg.sender == WRAPPED_DEPOSIT);
    if (token == TEST_TOKEN) {
      testTokenBalances[depositor] += amount;
      return true;
    }
    return false;
  }

  function acceptEtherDeposit(address depositor, uint amount) public override returns (bool) {
    require(msg.sender == WRAPPED_DEPOSIT);
    etherBalances[depositor] += amount;
    return true;
  }
}
