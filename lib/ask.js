const async = require('async')  // 这是node下一个异步处理的工具
const inquirer = require('inquirer')

const promptMapping = {
  string: 'input',
  boolean: 'confirm'
}

/**
 * 这个函数就是 根据meta.js里面定义的prompts来与用户进行交互
 * 然后收集用户的交互信息存放在metadate 也就是metalsmith元数据中
 * 用于渲染模版使用
 */
module.exports = function ask (prompts, metadate, done) {
  async.eachSeries(Object.keys(prompts), (key, next) => {  // 这里不能简单的使用数组的 foreach方法 否则直接跳到最后一个问题
    inquirer.prompt([{
      type: promptMapping[prompts[key].type] || prompts[key].type,
      name: key,
      message: prompts[key].message,
      choices: prompts[key].choices || [],
    }]).then(answers => {
      if (typeof answers[key] === 'string') {
        metadate[key] = answers[key].replace(/"/g, '\\"')
      } else {
        metadate[key] = answers[key]
      }
      next()
    }).catch(done)
  }, done) // 全部回答完 调用 done移交给下一个插件
}