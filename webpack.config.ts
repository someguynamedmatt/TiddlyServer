const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  //  mode: 'none',
  // TODO: This is a hack to get the files copied, we don't actually care about the output bundle
  //entry: './dist/src/init-server.js',
  entry: './src/init-server.ts',
  target: 'node',
  node: {
    fs: 'empty',
  },
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
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
}
