let postcss = require('postcss');
let loaderUtils = require('loader-utils');
let validate = require('schema-utils');
let path = require('path');
const schema = require('./optionSchema.json');
const syntax = require('postcss-less');
const storage = require('./contentTemp');
const stringify = require('./stringifier');
let fs = require('fs');
let globalVarsSet = new Set();
function themeLoader(source) {
  const option = loaderUtils.getOptions(this);
  validate(option, schema);
  this.options = option;
  const { globalVars } = option;
  Object.keys(globalVars).forEach(key => {
    globalVarsSet.add(key);
  });
  const callback = this.async();
  postcss()
    .process(source, { syntax: syntax })
    .then(result => {
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
          if (rule.nodes.length === 0) {
            let parent = rule.parent;
            rule.parent.removeChild(rule);
            // 删除全部空树将会导致缺少一个分号
            while (parent) {
              if (parent.nodes.length === 0) {
                const temp = parent;
                parent = parent.parent;
                temp.remove();
              } else {
                break;
              }
            }
          }
        });
      }
      root.nodes.forEach(deleteEmpty);
      if (root.nodes.length || atRuleName.size) {
        storage.add(root.toString(stringify));
        // storage.add(root.toResult());
        // sourceTemp = `/**THEMECSSBEGIN**\r\n${root.toString()}\r\n**THEMECSSEND**/\r\n${source}`;
      }
      callback(null, sourceTemp);
    });
}
function deleteEmpty(item) {
  if (item.nodes && item.nodes.length) {
    item.nodes.forEach(deleteEmpty);
  } else {
    if (item.nodes && item.nodes.length === 0) {
      item.remove();
    }
  }
}
function dealAtRule(rule, atRuleName) {
  const { params, name } = rule;
  let remove = true;
  globalVarsSet.forEach(key => {
    const keyTemp = key.replace(/^@/, '');
    if (params.indexOf(keyTemp) !== -1 || name.indexOf(keyTemp) !== -1) {
      remove = false;
      atRuleName.add(name);
    }
  });
  atRuleName.forEach(key => {
    const keyTemp = key.replace(/^@/, '');
    if (params.indexOf(keyTemp) !== -1 || name.indexOf(keyTemp) !== -1) {
      remove = false;
    }
  });
  if (remove) {
    rule.remove();
  }
}
function dealDecl(rule, atRuleName) {
  const { value, prop } = rule;
  let remove = true;
  globalVarsSet.forEach(key => {
    const keyTemp = key.replace(/^@/, '');
    if (value.indexOf(keyTemp) !== -1) {
      remove = false;
    }
  });
  atRuleName.forEach(key => {
    const keyTemp = key.replace(/^@/, '');
    if (value.indexOf(keyTemp) !== -1) {
      remove = false;
    }
  });
  if (remove || prop.startsWith('//')) {
    rule.remove();
  }
}
module.exports = themeLoader;
