const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
// Removed misplaced module block
module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    landing: './src/landing/index.js',
    login: './src/login/index.js',
    dashboard: './src/dashboard/index.js',
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,        // Transpile both .js and .jsx
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react' // Enables JSX support
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader' // Add this loader for Tailwind + PostCSS support
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Allow imports without file extensions
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'landing.html',
      template: './src/landing/index.html',
      chunks: ['landing']
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
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/images', to: 'images' }
      ]
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: '',
  },
};
