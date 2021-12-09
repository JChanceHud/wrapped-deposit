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

describe('WrapedDeposit', function () {
  it('should refuse deposit to non-contract', async () => {
    const { wrapped } = await getDeployedContracts()
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
  })
})
