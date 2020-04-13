let path = require('path');
let validate = require('schema-utils');
let schema = require("./optionSchema.json");
let postcss = require('postcss');
let htmlWebpackPlugin = require('html-webpack-plugin');
let fs = require('fs');
const storage = require('./contentTemp');
const { ConcatSource } = require("webpack-sources");
const contentReg = /\/\*\*THEMECSSBEGIN\*\*\n([\s\S]+)\n\*\*THEMECSSEND\*\*\//;
class ThemePlugin {
  constructor(options = {}) {
    validate(options, schema);
    this.options = options;
    console.log(this.options);
  }
  apply(compiler) {
    const { createHtmlTagObject, createHtmlTag } = htmlWebpackPlugin;
    // webpack4
    if(compiler.hooks) {
      compiler.hooks.emit.tap('themePlugin', (compilation) => {
        if (compiler.hooks.htmlWebpackPluginAlterAssetTags) {
          compiler.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('themePlugin', (data,cb) => {
            const { bodyTags } = data;
            bodyTags.push(createHtmlTagObject('link', { rel: "stylesheet/less",  href: process.env.PUBLIC_URL || '' + "/theme.less", type:"text/css" }));
            cb(null, data);
          });
        } else {
          htmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('themePlugin', (data,cb) => {
            const { bodyTags } = data;
            bodyTags.push(createHtmlTagObject('link', { rel: "stylesheet/less",  href: process.env.PUBLIC_URL || '' + "/theme.less", type:"text/css" }));
            cb(null, data);
          });
        }
      });
      compiler.hooks.emit.tapAsync('themePlugin', (compilation, cb) => {
        let themeContent = storage.get('\r\n');
        if(themeContent.length) {
          let val = Object.keys(this.options.globalVars).map(key => `${key.indexOf('@') === 0 ? key : '@'+key}:${this.options.globalVars[key]};`);
          Object.keys(this.options.otherVars).forEach(key => val.push(`${key.indexOf('@') === 0 ? key : '@'+key}:${this.options.otherVars[key]};`));
          themeContent = val.join('\r\n') + '\r\n' +themeContent;
          compilation.assets['theme.less'] = {
            // 返回文件内容
            source: () => {
              // fileContent 既可以是代表文本文件的字符串，也可以是代表二进制文件的 Buffer
              return themeContent;
            },
            // 返回文件大小
            size: () => {
              return Buffer.byteLength(themeContent, 'utf8');
            }
          };
        }
        cb();
      });
    } else {
      compiler.plugin('emit', (compilation, cb) => {
        let themeContent = storage.get('\r\n');
        if (themeContent.length) {
          const val = Object.keys(this.options.globalVars).map(
            key =>
              `${key.indexOf('@') === 0 ? key : '@' + key}:${
                this.options.globalVars[key]
              };`
          );
          Object.keys(this.options.otherVars).forEach(key =>
            val.push(
              `${key.indexOf('@') === 0 ? key : '@' + key}:${
                this.options.otherVars[key]
              };`
            )
          );
          themeContent = val.join('\r\n') + '\r\n' + themeContent;
          compilation.assets['theme.less'] = {
            // 返回文件内容
            source: () => {
              // fileContent 既可以是代表文本文件的字符串，也可以是代表二进制文件的 Buffer
              return themeContent;
            },
            // 返回文件大小
            size: () => {
              return Buffer.byteLength(themeContent, 'utf8');
            },
          };
        }
        cb();
      });
      compiler.plugin('compilation', function (compilation) {
        compilation.plugin('html-webpack-plugin-alter-asset-tags', function (htmlPluginData, callback) {
          const { body } = htmlPluginData;
          body.push({ tagName: 'link', selfClosingTag: false, attributes: { rel: 'stylesheet/less', href: (process.env.PUBLIC_URL || '') + "/theme.less" }});
          callback(null, htmlPluginData);
        });
      });
    }
  }
}
ThemePlugin.loader = path.resolve(__dirname, "./loader");
module.exports = ThemePlugin;
