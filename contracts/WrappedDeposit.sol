/// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface DepositReceiver {
  function acceptDeposit(address depositor, address token, uint amount) external;
}

interface IERC20 {
  function transferFrom(address sender, address recipient, uint amount) external returns (bool);
}

contract WrappedDeposit {
  function depositToken(address to, address token, uint amount) public {
    require(_isContract(to));
    DepositReceiver(to).acceptDeposit(msg.sender, token, amount);
    bytes memory data = abi.encodeWithSelector(
      IERC20(token).transferFrom.selector,
      msg.sender,
      to,
      amount
    );
    (bool success, bytes memory returndata) = token.call(data);
    require(success);
    if (returndata.length > 0) {
      // Return data is optional
      require(abi.decode(returndata, (bool)), "ERC20 operation did not succeed");
    }
  }

  function depositEther(address to) public payable {
    require(_isContract(to));
    DepositReceiver(to).acceptDeposit(msg.sender, address(0), msg.value);
    (bool success, ) = to.call{value: msg.value}('');
    require(success);
  }

  function _isContract(address c) private view returns (bool) {
    uint size;
    assembly {
      size := extcodesize(c)
    }
    return size > 0;
  }
}
