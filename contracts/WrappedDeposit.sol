/// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface ERC20Receiver {
  function acceptERC20Deposit(address depositor, address token, uint amount) external returns (bool);
}

interface ERC721Receiver {
  function acceptERC721Deposit(address depositor, address token, uint tokenId) external returns (bool);
}

interface ERC1155Receiver {
  function acceptERC1155Deposit(address depositor, address token, uint tokenId, uint value, bytes calldata data) external returns (bool);
  function acceptERC1155BatchDeposit(address depositor, address token, uint[] calldata tokenIds, uint[] calldata values, bytes calldata data) external returns (bool);
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

interface IERC1155 {
  function safeTransferFrom(address _from, address _to, uint _id, uint _value, bytes calldata _data) external;
  function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external;
}

contract WrappedDeposit {
  function depositERC20(address to, address token, uint amount) public {
    _assertContract(to);
    require(ERC20Receiver(to).acceptERC20Deposit(msg.sender, token, amount));
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
    require(ERC721Receiver(to).acceptERC721Deposit(msg.sender, token, tokenId));
    IERC721(token).transferFrom(msg.sender, to, tokenId);
  }

  function safeDepositERC721(address to, address token, uint tokenId, bytes memory data) public {
    _assertContract(to);
    require(ERC721Receiver(to).acceptERC721Deposit(msg.sender, token, tokenId));
    IERC721(token).safeTransferFrom(msg.sender, to, tokenId, data);
  }

  function safeDepositERC1155(address to, address token, uint tokenId, uint value, bytes calldata data) public {
    _assertContract(to);
    require(ERC1155Receiver(to).acceptERC1155Deposit(msg.sender, to, tokenId, value, data));
    IERC1155(token).safeTransferFrom(msg.sender, to, tokenId, value, data);
  }

  function batchDepositERC1155(address to, address token, uint[] calldata tokenIds, uint[] calldata values, bytes calldata data) public {
    _assertContract(to);
    require(ERC1155Receiver(to).acceptERC1155BatchDeposit(msg.sender, to, tokenIds, values, data));
    IERC1155(token).safeBatchTransferFrom(msg.sender, to, tokenIds, values, data);
  }

  function depositEther(address to) public payable {
    _assertContract(to);
    require(EtherReceiver(to).acceptEtherDeposit(msg.sender, msg.value));
    (bool success, ) = to.call{value: msg.value}('');
    require(success, "nonpayable");
  }

  function _assertContract(address c) private view {
    uint size;
    assembly {
      size := extcodesize(c)
    }
    require(size > 0, "noncontract");
  }
}
