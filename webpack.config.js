const debug = (process.env.NODE_ENV !== "production");
var webpack = require('webpack');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

module.exports = {
    entry : {
        'app': [`${__dirname}/src`]
    },
    module : {
        rules : [
            {
                test: /\.js$/,
                exclude:/(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets : ['react','es2015','stage-0'],
                    plugins: ['react-html-attrs', 'transform-class-properties', 'transform-decorators-legacy']
                }
            }
        ]
    },
    output : {
        path : `${__dirname}/public/javascripts`,
        filename : '[name].min.js'
    },
    mode: (debug)?"development":"production",
    plugins:debug ? [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                },
            })
        ] : [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new UnminifiedWebpackPlugin({mangle:false, sourcemap:false}),
        new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                },
            })
    ]
}