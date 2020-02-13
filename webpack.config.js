const path = require('path');
const webpack = require('webpack');

module.exports = {
	mode: 'development',
	entry: {
		'app/js/App': __dirname + '/app/src/js/App.js',
		'craft/web/js/App': __dirname + '/app/src/js/App.js'
	},
	output: {
		path: __dirname,
		filename: '[name].js'
	},
	plugins: [
		new webpack.ProvidePlugin({
			jQuery: 'jquery',
			$: 'jquery',
			jquery: 'jquery'
		})
	],
	module: {
		rules: [
			{
				test: /\.js/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [ 'es2015' ]
					}
				}
			}
		]
	}
};
