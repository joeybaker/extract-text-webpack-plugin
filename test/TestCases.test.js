var fs = require("fs");
var vm = require("vm");
var path = require("path");
var webpack = require("webpack");
var should = require("should");
var ExtractTextPlugin = require("../");

var cases = process.env.CASES ? process.env.CASES.split(",") : fs.readdirSync(path.join(__dirname, "cases"));

describe("TestCases", function() {
	cases.forEach(function(testCase) {
		it(testCase, function(done) {
			var testDirectory = path.join(__dirname, "cases", testCase);
			var outputDirectory = path.join(__dirname, "js", testCase);
			var options = { entry: { test: "./index.js" } };
			var configFile = path.join(testDirectory, "webpack.config.js");
			if(fs.existsSync(configFile))
				options = require(configFile);
			options.context = testDirectory;
			if(!options.module) options.module = {};
			if(!options.module.loaders) options.module.loaders = [
				{ test: /\.txt$/, loader: ExtractTextPlugin.extract("raw-loader") }
			];
			if(!options.output) options.output = { filename: "[name].js" };
			if(!options.output.path) options.output.path = outputDirectory;
			if(process.env.CASES) {
				console.log("\nwebpack." + testCase + ".config.js " + JSON.stringify(options, null, 2));
			}
			webpack(options, function(err, stats) {
				if(err) return done(err);
				if(stats.hasErrors()) return done(new Error(stats.toString()));
				var testFile = path.join(testDirectory, "test.js");
				if(fs.existsSync(testFile))
					require(testFile)(describe);
				var expectedDirectory = path.join(testDirectory, "expected");
				fs.readdirSync(expectedDirectory).forEach(function(file) {
					var filePath = path.join(expectedDirectory, file);
					var actualPath = path.join(outputDirectory, file);
					readFileOrEmpty(actualPath).should.be.eql(
						readFileOrEmpty(filePath),
						file + " should be correct");
				});
				done();
			});
		});
	});
});

function readFileOrEmpty(path) {
	try {
		return fs.readFileSync(path, "utf-8");
	} catch(e) {
		return "";
	}
}
