var path = require("path")

var webpack = require('webpack')

const BundleTracker = require('webpack-bundle-tracker')

var ip = 'localhost'

module.exports = {
  context: __dirname,

  entry: {
    App: [
      'webpack-dev-server/client?http://' + ip + ':3000',
      'webpack/hot/only-dev-server',
      './frontend/App.jsx'
    ],
    vendors: ['react'],
  },

  output: {
      path: path.resolve('./battlecode/static/bundles/local/'),
      publicPath: 'http://' + ip + ':3000' + '/assets/bundles/',
      filename: "[name]-[hash].js"
  },

  externals: [],

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new BundleTracker({filename: './webpack-stats.json'}),
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
        ],
      },
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },
}
