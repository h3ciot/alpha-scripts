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
    const { createHtmlTagObject } = htmlWebpackPlugin;
    compiler.hooks.emit.tap('themePlugin', (compilation) => {
      // compilation.hooks.emit
      // htmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync('themePlugin', (data, cb) => {
      //     const { assets } = data;
      //     const { css } = assets;
      //     const { createHtmlTagObject } = htmlWebpackPlugin;
      //     for(const x of css) {
      //         console.log(x);
      //         const themeCss = createHtmlTagObject({ tagName: 'link', attributes: { ref: "stylesheet/less alternate stylesheet", type: "text/css",  href: "theme.less" } });
      //         css.push(themeCss);
      //     }
      //     cb();
      // });
      // htmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('themePlugin', (data, cb) => {
      //     const { assetTags } = data;
      //     const { styles, scripts } = assetTags;
      
      //     const themeCss = createHtmlTagObject('link', { ref: "stylesheet/less", type: "text/css",  href: "theme.less" });
      //     styles.push(themeCss);
      //     scripts.push(createHtmlTagObject('script', { src: "http://cdnjs.cloudflare.com/ajax/libs/less.js/3.9.0/less.min.js" }));
      //     cb(null, data);
      // });
      htmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('themePlugin', (data,cb) => {
        const { bodyTags } = data;
        bodyTags.push(createHtmlTagObject('link', { rel: "stylesheet/less",  href: process.env.PUBLIC_URL || '' + "/theme.less", type:"text/css" }));
        cb(null, data);
      });
    });
    compiler.hooks.emit.tapAsync('themePlugin', (compilation, cb) => {
      // console.log(compilation);
      const { assets } = compilation;
      // for(const key in assets) {
      //     if(key.endsWith('.css')) {
      //         const source = assets[key].source();
      //         const ret = contentReg.exec(source);
      //         if(ret) {
      //             themeContent.push(ret[1]);
      //             // console.log('path:', compilation.getPath(key))
      //             // compilation.updateAsset(key, old => new ConcatSource(assets[key].source().replace(contentReg, '')) )
      //         }
      //     }
      // }
      let themeContent = storage.get('\r\n');
      if(themeContent.length) {
        let val = Object.keys(this.options.globalVars).map(key => `${key.indexOf('@') === 0 ? key : '@'+key}:${this.options.globalVars[key]};`);
        Object.keys(this.options.otherVars).forEach(key => val.push(`${key.indexOf('@') === 0 ? key : '@'+key}:${this.options.otherVars[key]};`));
        themeContent = val.join('\r\n') + '\r\n' +themeContent;
        // 设置名称为 fileName 的输出资源
        // const themeFileContent = fs.readFileSync(this.options.themeFile, { encoding: 'utf-8'}).toString();
        // themeContent.unshift(themeFileContent);
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
    
  }
}
ThemePlugin.loader = path.resolve(__dirname, "./loader");
module.exports = ThemePlugin;
