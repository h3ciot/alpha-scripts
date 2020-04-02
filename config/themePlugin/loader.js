let postcss = require('postcss');
let loaderUtils = require('loader-utils');
let validate = require('schema-utils');
let path = require('path');
const schema = require('./optionSchema.json');
const syntax = require('postcss-less');
const storage = require('./contentTemp');
let fs = require('fs');
let globalVarsSet = new Set();
function themeLoader(source) {
  const option = loaderUtils.getOptions(this);
  validate(option, schema);
  this.options = option;
  const { globalVars } = option;
  console.log(globalVars);
  Object.keys(globalVars).forEach(key => {
    globalVarsSet.add(key);
  });
  const callback = this.async();
  postcss().process(source, { syntax: syntax }).then(result => {
    const root = result.root;
    let sourceTemp = source;
    const atRuleName = new Set();
    if (globalVarsSet.size) {
      // 遍历相关节点,并移除无用节点
      root.walkAtRules(rule => dealAtRule(rule, atRuleName));
      root.walkDecls(rule => dealDecl(rule, atRuleName));
      root.walkComments(comment => {
        comment.parent.removeChild(comment);
      });
      root.walkRules(rule => {
        console.log('rule:', rule);
        if (rule.nodes.length === 0) {
          let parent = rule.parent;
          rule.parent.removeChild(rule);
          // 删除全部空树将会导致缺少一个分号
          while(parent) {
            if(parent.nodes.length === 0) {
              if (parent.parent) {
                parent.parent.removeChild(parent);
              } else {
                parent.remove();
              }
              parent = parent.parent;
            } else {
              break;
            }
          }
        }
      });
    }
    if (root.nodes.length || atRuleName.size) {
      storage.add(root.toString());
      // storage.add(root.toResult());
      // sourceTemp = `/**THEMECSSBEGIN**\r\n${root.toString()}\r\n**THEMECSSEND**/\r\n${source}`;
    }
    callback(null, sourceTemp);
  });
}
function dealAtRule(rule, atRuleName) {
  const { params, name } = rule;
  let remove = true;
  console.log('params:', params, 'name:', name);
  globalVarsSet.forEach(key => {
    const keyTemp = key.replace(/^@/, '');
    if (params.indexOf(keyTemp) !== -1 || name.indexOf(keyTemp) !== -1) {
      remove = false;
      atRuleName.add(name.replace(/:$/, ""));
    }
  });
  if (remove) {
    rule.remove();
  }
}
function dealDecl(rule, atRuleName) {
  const { value, prop } = rule;
  let remove = true;
  atRuleName.forEach(key => {
    if (value.indexOf(key) !== -1 || prop.indexOf(key) !== -1) {
      remove = false;
    }
  });
  globalVarsSet.forEach(key => {
    if (value.indexOf(key) !== -1 || prop.indexOf(key) !== -1) {
      remove = false;
    }
  });
  if (remove || prop.startsWith('//')) {
    rule.remove();
  }
}
module.exports = themeLoader;
