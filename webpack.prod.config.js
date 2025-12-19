import { fileURLToPath } from 'url';
import path from 'path';
import { merge } from 'webpack-merge';
import commonConfig from './webpack.config.js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, 'node_modules/monaco-editor'),
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.s?[ac]ss$/i,
        exclude: path.resolve(__dirname, 'node_modules/monaco-editor'), // Exclude Monaco's CSS
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.[jt]sx?$/i,
        exclude: /(node_modules)/,
        use: 'swc-loader',
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: '[name].css' })],
});
