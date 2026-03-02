import { merge } from 'webpack-merge';
import commonConfig from './webpack.config.js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export default merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
              sassOptions: {
                silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'if-function'],
              },
            },
          },
        ],
      },
      {
        test: /\.[jt]sx?$/i,
        exclude: /(node_modules)/,
        use: 'swc-loader',
      },
    ],
  },
  optimization: {
    minimizer: [
      '...', // Keep default minimizers (terser for JS)
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: '[name].css' })],
});
