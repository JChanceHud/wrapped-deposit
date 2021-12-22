/// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract TestNonReceiver {
  fallback() external payable {}
}
