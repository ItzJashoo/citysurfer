const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    landing:'./src/landing/index.js',
    login:'./src/login/index.js',
    dashboard:'./src/dashboard/index.js',
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'landing.html',
      template: './src/landing/index.html',
      chunks: ['home']
    }),
    new HtmlWebpackPlugin({
      filename: 'login.html',
      template: './src/login/index.html',
      chunks: ['login']
    }),
    new HtmlWebpackPlugin({
      filename: 'dashboard.html',
      template: './src/dashboard/index.html',
      chunks: ['dashboard']
    })
  ],
    output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  }
};