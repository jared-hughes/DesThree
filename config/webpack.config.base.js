const path = require('path')
const webpack = require('webpack')

const webpackConfig = {
  resolve: {
    extensions: ['.js']
  },
  optimization: {
    minimize: false
  },
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      // js uses the default loader
      // other loaders would go here, but there is no need for any
    ]
  },
  plugins: [
    new webpack.ids.HashedModuleIdsPlugin({
      context: __dirname,
    })
  ]
}

module.exports = webpackConfig
