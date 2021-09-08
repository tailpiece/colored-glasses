const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const config = {
  entry: {
    'popup': './src/index.js',
  },
  output: {
    path: path.join(__dirname, "package"),
    filename: '[name]/[name].js', //バンドルのファイル名。[name]の部分にはentryで指定したキーが入る
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: [
      '.js',
      '.vue'
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  performance: {
    maxEntrypointSize: 300000,
    maxAssetSize: 300000
  },
  //webpack-dev-server用設定
  devServer: {
    open: {
      target: "popup/popup.html", //自動で指定したページを開く
    },
    static: {
      directory: path.join(__dirname, 'package'), // HTML等コンテンツのルートディレクトリ
      watch: true, //コンテンツの変更監視をする
    },
    port: 3000, // ポート番号
  }
};

module.exports = config;
