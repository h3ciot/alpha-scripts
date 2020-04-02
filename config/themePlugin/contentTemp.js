/**
 * @author:lpf
 * @flow
 *
 **/
const storage = [];
function add(content) {
  console.log('add:', content);
   storage.push(content);
}
function get(split) {
   return storage.join(split);
}

module.exports =  { get, add };
