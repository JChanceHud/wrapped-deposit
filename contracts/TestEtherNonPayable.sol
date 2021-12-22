/// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract TestEtherNonPayable {
  function acceptEtherDeposit(address depositor, uint amount) external returns (bool) {
    return true;
  }
}
