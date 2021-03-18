const { merge } = require('webpack-merge')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const UserScriptMetaDataPlugin = require('userscript-metadata-webpack-plugin')
const metadata = require('./metadata')

metadata.downloadURL = 'https://github.com/jared-hughes/DesThree/releases/latest/download/DesThree.user.js'
metadata.updateURL = 'https://github.com/jared-hughes/DesThree/releases/latest/download/DesThree.user.js'

const webpackConfig = require('./webpack.config.base')
const cfg = merge({}, webpackConfig, {
  entry: {
    DesThree: webpackConfig.entry
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'webpack-strip-block',
            options: {
              start: 'DEV-START',
              end: 'DEV-END'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new UserScriptMetaDataPlugin({
      metadata
    })
  ]
})

if (process.env.npm_config_report) {
  cfg.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = cfg
