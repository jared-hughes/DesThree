const { merge } = require('webpack-merge')

const UserScriptMetaDataPlugin = require('userscript-metadata-webpack-plugin')
const metadata = require('./metadata')

metadata.name += '-test'

const webpackConfig = require('./webpack.config.base')
const cfg = merge({}, webpackConfig, {
  entry: {
    'DesThree-test': './src/tests/indexIntegration.js'
  },
  plugins: [
    new UserScriptMetaDataPlugin({
      metadata
    })
  ]
})

module.exports = cfg
