const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',

  entry: {
    checkout: './src/sdk/PaymentGateway.js',
    iframe: './src/iframe-content/main.js'
  },

 output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      name: 'PaymentGateway',
      type: 'umd',
      export: 'PaymentGateway'   // 👈 THIS IS THE FIX
    },
    globalObject: 'this',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'iframe.html',
      template: './src/iframe-content/template.html',
      chunks: ['iframe']
    })
  ]
};