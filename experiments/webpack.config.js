const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/scripts/init.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/index.html', to: 'index.html' },
                { from: './src/styles.css', to: 'styles.css' },
                { from: './src/lib', to: 'lib' },
                { from: './src/assets', to: 'assets', noErrorOnMissing: true }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'build'),
        },
        compress: true,
        port: 8080,
        open: true
    }
};
