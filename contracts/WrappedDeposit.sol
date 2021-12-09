/// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface ERC20Receiver {
  function acceptERC20Deposit(address depositor, address token, uint amount) external returns (bool);
}

interface ERC721Receiver {
  function acceptERC721Deposit(address depositor, address token, uint tokenid) external returns (bool);
}

interface EtherReceiver {
  function acceptEtherDeposit(address depositor, uint amount) external returns (bool);
}

interface IERC20 {
  function transferFrom(address sender, address recipient, uint amount) external returns (bool);
}

interface IERC721 {
  function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
  function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory data) external payable;
}

contract WrappedDeposit {
  function depositERC20(address to, address token, uint amount) public {
    _assertContract(to);
    _tryExecute(to, abi.encodeWithSelector(
      ERC20Receiver(to).acceptERC20Deposit.selector,
      msg.sender,
      token,
      amount
    ));
    bytes memory data = abi.encodeWithSelector(
      IERC20(token).transferFrom.selector,
      msg.sender,
      to,
      amount
    );
    (bool success, bytes memory returndata) = token.call(data);
    require(success);
    // backward compat for tokens incorrectly implementing the transfer function
    if (returndata.length > 0) {
      require(abi.decode(returndata, (bool)), "ERC20 operation did not succeed");
    }
  }

  function depositERC721(address to, address token, uint tokenId) public {
    _assertContract(to);
    _tryExecute(to, abi.encodeWithSelector(
      ERC721Receiver(to).acceptERC721Deposit.selector,
      msg.sender,
      token,
      tokenId
    ));
    IERC721(token).transferFrom(msg.sender, to, tokenId);
  }

  function safeDepositERC721(address to, address token, uint tokenId, bytes memory data) public {
    _assertContract(to);
    _tryExecute(to, abi.encodeWithSelector(
      ERC721Receiver(to).acceptERC721Deposit.selector,
      msg.sender,
      token,
      tokenId
    ));
    IERC721(token).safeTransferFrom(msg.sender, to, tokenId, data);
  }

  function depositEther(address to) public payable {
    _assertContract(to);
    _tryExecute(to, abi.encodeWithSelector(
      EtherReceiver(to).acceptEtherDeposit.selector,
      msg.sender,
      msg.value
    ));
    (bool success, ) = to.call{value: msg.value}('');
    require(success, "nonpayable");
  }

  /**
   * Try to call a function that should return a boolean. If anything other
   * than true is returned revert.
   **/
  function _tryExecute(address to, bytes memory data) private {
    (bool success, bytes memory returndata) = to.call(data);
    require(success, "fail");
    require(returndata.length > 0, "noreturndata");
    require(abi.decode(returndata, (bool)), "badreturn");
  }

  function _assertContract(address c) private view {
    uint size;
    assembly {
      size := extcodesize(c)
    }
    require(size > 0, "noncontract");
  }
}
