const assert = require('assert')
const { ethers } = require('hardhat')

async function getDeployedContracts() {
  const WrappedDeposit = await ethers.getContractFactory('WrappedDeposit')
  const wrapped = await WrappedDeposit.deploy()
  await wrapped.deployed()

  const TestToken = await ethers.getContractFactory('TestToken')
  const testToken = await TestToken.deploy()
  await testToken.deployed()

  const TestReceiver = await ethers.getContractFactory('TestReceiver')
  const testReceiver = await TestReceiver.deploy(wrapped.address, testToken.address)
  await testReceiver.deployed()
  return { wrapped, testToken, testReceiver }
}

async function exec(fnCall) {
  const tx = await fnCall
  await tx.wait()
}

describe('WrapedDeposit', function () {
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
    const startBalance = await testReceiver.testTokenBalances(sender.address)

    // mint some tokens
    await exec(testToken.connect(sender).mint(1000))
    // set an approval
    await exec(testToken.connect(sender).approve(wrapped.address, 9999999999999))
    // run the deposit
    await exec(wrapped.connect(sender).depositERC20(testReceiver.address, testToken.address, 10))

    const endBalance = await testReceiver.testTokenBalances(sender.address)
    assert.equal(+endBalance.toString() - +startBalance.toString(), 10)
  })
})
