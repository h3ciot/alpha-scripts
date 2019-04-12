/**
 * @author:lpf
 * @flow
 *
 **/
const getGitInfo = require("./buildInfo").getGitInfo;
function InjectGitInfoPlugin(options) {
    options = options || {};
    this.options = options;
}
InjectGitInfoPlugin.prototype.apply = function (compiler) {
    const workPath = this.options.workPath || './';
    if (compiler.hooks) {
        compiler.hooks.compilation.tap('InjectGitInfoPlugin', function(compilation) {
                var HtmlWebpackPlugin = require('html-webpack-plugin');
                var hooks = HtmlWebpackPlugin.getHooks(compilation);
                hooks.alterAssetTags.tap('InjectGitInfoPlugin', function (htmlPluginData) {
                    const scripts = htmlPluginData.assetTags.scripts;
                    let info = {};
                    try {
                        info = getGitInfo(workPath);
                    } catch (e) {
                        console.log(e);
                    }
                    const newScript = HtmlWebpackPlugin.createHtmlTagObject('script', {type: "text/javascript"}, "window.gitInfo = " + JSON.stringify(info));
                    scripts.push(newScript);
                });
            })
    } else {
        compiler.plugin('compilation', function(compilation) {
            compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData, callback) {
              const scripts = htmlPluginData.assetTags.scripts;
                let info = {};
                try {
                    info = getGitInfo(workPath);
                } catch (e) {
                    console.log(e);
                }
              var HtmlWebpackPlugin = require('html-webpack-plugin');
              const newScript = HtmlWebpackPlugin.createHtmlTagObject('script', {type: "text/javascript"}, "window.gitInfo = " + JSON.stringify(info));
              scripts.push(newScript);
              callback(null, htmlPluginData);
            });
        });
    }

};
module.exports = InjectGitInfoPlugin;
