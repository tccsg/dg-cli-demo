const path = require('path')

/**
 * 这里的options内容比较简单
 * 就是用于用来获取 meta.js 里面的配置
 */
module.exports = function options (name, dir) {
  const metaPath = path.join(dir, 'meta.js')
  const req = require(metaPath)
  let opts = {}
  opts = req
  return opts
}