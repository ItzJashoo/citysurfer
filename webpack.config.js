const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    landing:   './src/landing/index.js',
    login:     './src/login/index.js',
    dashboard: './src/dashboard/index.js',
    profile:   './src/profile/index.js',
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    // Landing
    new HtmlWebpackPlugin({
      filename: 'landing.html',
      template: './src/landing/index.html',
      chunks: ['landing'],
      inject: 'body'
    }),
    // Login
    new HtmlWebpackPlugin({
      filename: 'login.html',
      template: './src/login/index.html',
      chunks: ['login'],
      inject: 'body'
    }),
    // Dashboard
    new HtmlWebpackPlugin({
      filename: 'dashboard.html',
      template: './src/dashboard/index.html',
      chunks: ['dashboard'],
      inject: 'body'
    }),
    // Profile
    new HtmlWebpackPlugin({
      filename: 'profile.html',
      template: './src/profile/index.html',
      chunks: ['profile'],
      inject: 'body'
    }),
    // Index
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      chunks: ['index'],
      inject: 'body'
    }),
    // 404
    new HtmlWebpackPlugin({
      filename: '404.html',
      template: './src/404.html',
      chunks: ['404'],
      inject: 'body'
    }),

    // Copy static assets (images, etc)
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/images', to: 'images' }]
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: '',
  },
};
