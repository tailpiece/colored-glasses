const path = require('path');

const config = {
  entry: {
    'bundle': './src/index.js',
  },
  output: {
    path: path.join(__dirname, "public"),
    filename: '[name].js', //バンドルのファイル名。[name]の部分にはentryで指定したキーが入る
  },
  module: {
    rules: [
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
  //webpack-dev-server用設定
  devServer: {
    open: true, //ブラウザを自動で開く
    openPage: "index.html", //自動で指定したページを開く
    contentBase: path.join(__dirname, 'public'), // HTML等コンテンツのルートディレクトリ
    watchContentBase: true, //コンテンツの変更監視をする
    port: 3000, // ポート番号
  }
};

module.exports = config;
