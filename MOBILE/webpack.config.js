const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Configuração do ponto de entrada
  entry: './src/index.tsx',
  
  // Configuração de saída
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  // Resolução de módulos
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      'react-native$': 'react-native-web'
    }
  },

  // Configuração de módulos
  module: {
    rules: [
      // Transpilação de TypeScript/JavaScript
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      // Processamento de assets
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: ['file-loader']
      },
      // Processamento de estilos
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  // Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],

  // Configuração do servidor de desenvolvimento
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000
  },

  // Configurações de otimização
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    splitChunks: {
      chunks: 'all'
    }
  }
}; 