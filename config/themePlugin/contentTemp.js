/**
 * @author:lpf
 * @flow
 *
 **/
const storage = [];
function add(content) {
  storage.push(content);
}
function get(split) {
  return storage.join(split);
}

module.exports =  { get, add };
