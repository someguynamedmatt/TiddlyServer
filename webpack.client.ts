const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'none',
  // TODO: This is a hack to get the files copied, we don't actually care about the output bundle
  entry: './dist/server.js',
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: false }),
    new CopyPlugin([
      {
        from: './src/client/**/*',
        // TODO: don't ignore js files because some src's are dependenent on them, these should
        // be converted to TS
        ignore: ['node_modules', 'tsconfig.*', '*.ts'],
      },
    ]),
  ],
  module: {
    rules: [
      {
        test: /server\.js$/i,
        exclude: /node_modules/,
        loaders: ['shebang-loader', 'ts-loader'],
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: {
            root: './dist/src/client',
          },
        },
      },
    ],
  },
}
