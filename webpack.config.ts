import { Configuration } from "webpack";
import { resolve } from "path";

const config: Configuration = {
	mode: `production`,
	entry: `./src/arkahtml.ts`,
	output: {
		path: resolve(__dirname, 'dist'),
		filename: 'bundle.js',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/i,
				use: `ts-loader`,
				exclude: /node_modules/,
			}
		],
	},
	resolve: {
		extensions: [`.tsx`, `.ts`, `.js`],
	},
	optimization: {
		mangleExports: "size",
	}
};

export default config;
