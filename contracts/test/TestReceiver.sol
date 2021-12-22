pragma solidity ^0.7.0;

import "../WrappedDeposit.sol";

contract TestReceiver is ERC20Receiver, EtherReceiver {
  mapping (address => uint) public testTokenBalances;
  mapping (address => uint) public etherBalances;
  address immutable WRAPPED_DEPOSIT;
  address immutable TEST_TOKEN;
  address immutable TEST_TOKEN_NON_STANDARD;

  constructor(address wrappedDeposit, address testToken, address testTokenNonStandard) {
    WRAPPED_DEPOSIT = wrappedDeposit;
    TEST_TOKEN = testToken;
    TEST_TOKEN_NON_STANDARD = testTokenNonStandard;
  }

  fallback() external payable {}

  function acceptERC20Deposit(address depositor, address token, uint amount) public override returns (bool) {
    require(msg.sender == WRAPPED_DEPOSIT);
    if (token == TEST_TOKEN || token == TEST_TOKEN_NON_STANDARD) {
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
