const assert = require('assert')
const { ethers } = require('hardhat')

async function getDeployedContracts() {
  const WrappedDeposit = await ethers.getContractFactory('WrappedDeposit')
  const wrapped = await WrappedDeposit.deploy()
  await wrapped.deployed()

  const TestToken = await ethers.getContractFactory('TestToken')
  const testToken = await TestToken.deploy()
  await testToken.deployed()

  const TestTokenNonStandard = await ethers.getContractFactory('TestTokenNonStandard')
  const testTokenNonStandard = await TestTokenNonStandard.deploy()
  await testTokenNonStandard.deployed()

  const TestReceiver = await ethers.getContractFactory('TestReceiver')
  const testReceiver = await TestReceiver.deploy(wrapped.address, testToken.address, testTokenNonStandard.address)
  await testReceiver.deployed()

  const TestNonReceiver = await ethers.getContractFactory('TestNonReceiver')
  const nonReceiver = await TestNonReceiver.deploy()
  await nonReceiver.deployed()

  const TestEtherNonPayable = await ethers.getContractFactory('TestEtherNonPayable')
  const etherNonPayable = await TestEtherNonPayable.deploy()
  await etherNonPayable.deployed()

  return { wrapped, testToken, testReceiver, nonReceiver, etherNonPayable, testTokenNonStandard }
}

async function exec(fnCall) {
  const tx = await fnCall
  await tx.wait()
}

describe('WrappedDeposit', function () {
  it('should refuse deposit to non-contract', async () => {
    const { wrapped, testToken } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()

    try {
      const tx = await wrapped.connect(sender).depositEther(
        '0x0000000000000000000000000000000000000000',
        {
          value: 1000,
        }
      )
      await tx.wait()
    } catch (err) {
      assert(
        err.toString().indexOf('reverted with reason string \'noncontract\'') !== -1
      )
    }
    try {
      const tx = await wrapped.connect(sender).depositERC20(
        '0x0000000000000000000000000000000000000000',
        testToken.address,
        10
      )
      await tx.wait()
    } catch (err) {
      assert(
        err.toString().indexOf('reverted with reason string \'noncontract\'') !== -1
      )
    }
  })

  it('should revert if no accept deposit function', async () => {
    const { wrapped, testToken, nonReceiver } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()

    try {
      const tx = await wrapped.connect(sender).depositEther(
        testToken.address,
        {
          value: 1000,
        }
      )
      await tx.wait()
    } catch (err) {
      assert(err.toString().indexOf('function selector was not recognized') !== -1)
    }
    try {
      const tx = await wrapped.connect(sender).depositERC20(
        testToken.address,
        testToken.address,
        10
      )
      await tx.wait()
    } catch (err) {
      assert(err.toString().indexOf('function selector was not recognized') !== -1)
    }
    try {
      const tx = await wrapped.connect(sender).depositEther(
        nonReceiver.address,
        {
          value: 1000,
        }
      )
      await tx.wait()
    } catch (err) {
      assert(err.toString().indexOf('function returned an unexpected amount of data') !== -1)
    }
    try {
      const tx = await wrapped.connect(sender).depositERC20(
        nonReceiver.address,
        testToken.address,
        10
      )
      await tx.wait()
    } catch (err) {
      assert(err.toString().indexOf('function returned an unexpected amount of data') !== -1)
    }
  })

  it('should fail to deposit ether if non-payable', async () => {
    const { wrapped, etherNonPayable } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()
    try {
      const tx = await wrapped.connect(sender).depositEther(etherNonPayable.address, {
        value: 1000,
      })
      await tx.wait()
    } catch (err) {
      assert(err.toString().indexOf('nonpayable') !== -1)
    }
  })

  it('should fail to deposit erc20', async () => {
    const { wrapped, testReceiver, testToken } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()

    // mint some tokens
    await exec(testToken.connect(sender).mint(1000))
    try {
      // run the deposit
      await exec(wrapped.connect(sender).depositERC20(testReceiver.address, testToken.address, 10))
    } catch (err) {
      assert(err.toString().indexOf('transferfail') !== -1)
    }
  })

  it('should fail to deposit non-standard erc20', async () => {
    const { wrapped, testReceiver, testTokenNonStandard } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()

    // mint some tokens
    await exec(testTokenNonStandard.connect(sender).mint(1000))
    try {
      // run the deposit
      await exec(wrapped.connect(sender).depositERC20(testReceiver.address, testTokenNonStandard.address, 10))
    } catch (err) {
      assert(err.toString().indexOf('transferfail') !== -1)
    }
  })

  it('should deposit ether', async () => {
    const { wrapped, testReceiver } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()
    const startBalance = await testReceiver.etherBalances(sender.address)
    const tx = await wrapped.connect(sender).depositEther(testReceiver.address, {
      value: 1000,
    })
    await tx.wait()
    const finalBalance = await testReceiver.etherBalances(sender.address)
    assert.equal(+finalBalance - +startBalance, 1000)
  })

  it('should deposit erc20', async () => {
    const { wrapped, testReceiver, testToken } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()
    const DEPOSIT_AMOUNT = 10
    const startBalanceCalc = await testReceiver.testTokenBalances(sender.address)
    const startBalance = await testToken.balanceOf(testReceiver.address)

    // mint some tokens
    await exec(testToken.connect(sender).mint(1000))
    // set an approval
    await exec(testToken.connect(sender).approve(wrapped.address, 9999999999999))
    // run the deposit
    await exec(wrapped.connect(sender).depositERC20(testReceiver.address, testToken.address, DEPOSIT_AMOUNT))

    const endBalanceCalc = await testReceiver.testTokenBalances(sender.address)
    const endBalance = await testToken.balanceOf(testReceiver.address)
    assert.equal(+endBalanceCalc.toString() - +startBalanceCalc.toString(), DEPOSIT_AMOUNT)
    assert.equal(+endBalance.toString() - +startBalance.toString(), DEPOSIT_AMOUNT)
  })

  it('should deposit erc20 with non-standard sig', async () => {
    const { wrapped, testReceiver, testTokenNonStandard } = await getDeployedContracts()
    const [ sender ] = await ethers.getSigners()
    const DEPOSIT_AMOUNT = 10
    const startBalanceCalc = await testReceiver.testTokenBalances(sender.address)
    const startBalance = await testTokenNonStandard.balanceOf(testReceiver.address)

    // mint some tokens
    await exec(testTokenNonStandard.connect(sender).mint(1000))
    // set an approval
    await exec(testTokenNonStandard.connect(sender).approve(wrapped.address, 9999999999999))
    // run the deposit
    await exec(wrapped.connect(sender).depositERC20(testReceiver.address, testTokenNonStandard.address, DEPOSIT_AMOUNT))

    const endBalanceCalc = await testReceiver.testTokenBalances(sender.address)
    const endBalance = await testTokenNonStandard.balanceOf(testReceiver.address)
    assert.equal(+endBalance.toString() - +startBalance.toString(), DEPOSIT_AMOUNT)
    assert.equal(+endBalance.toString() - +startBalance.toString(), DEPOSIT_AMOUNT)
  })
})
