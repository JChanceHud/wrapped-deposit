/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.6",
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 99999,
      }
    }
  },
  networks: {
    goerli: {
      url: 'http://192.168.1.198:9545',
      accounts: ['0x6afb38998c73c93abfe21e137609dad96e4c0e7164a5af4e87641d7188f05f42']
    }
  },
  mocha: {
    timeout: 300000
  }
};
