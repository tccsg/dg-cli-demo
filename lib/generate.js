const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const path = require('path')
const chalk = require('chalk')
const getOptions = require('./options')
const ask = require('./ask')


/**
 * 把generate 导出去给dg.js使用
 * opts是通过getOptions()函数用来获取 meta.js中的配置
 * metalsmith是通过metalsmith.js获取模版的元数据
 * metalmith可以让我们编写一些插件来对项目下面的文件进行配置
 * 其中第一个use的第一个插件就是用来在终端中输入一些问题一些选项让我们设置一些模版中的细节
 * 而这些问题就是 放在meta.js中
 * 第二个use的插件这是渲染模版，这里就是用了handebars.js来渲染模版
 * 
 */
module.exports = function generate (name, tem, dest, done) {
  const opts = getOptions(name, tem)
  const metalsmith = Metalsmith(path.join(tem, 'template'))
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd()
  })
  metalsmith.use(askQuestions(opts.prompts)).use(renderTemplateFiles())  // 这两个插件在下面的代码中
  // 在构建前执行一些函数
  metalsmith.clean(false)
    .source('.') // 默认的source路径是 ./src 所以这边要改成整个 template 这个根据自己要输出的需求配置
    .destination(dest)  // 要输出到哪个路径下 这里就是 我们的项目地址
    .build((err, files) => {  // 最后进行构建项目
      done(err) // 执行 回掉函数
      if (typeof opts.complete === 'function') {
        const helpers = { chalk }
        opts.complete(data, helpers)  // 判断meta.js中是否定义了构建完成后要执行的函数 这里是判断是否执行自动安装依赖
      } else {
        console.log('complete is not a function')
      }
    })
}


/**
 * 这里通过这个函数返回一个metalsmith的符合metalsmith插件格式的函数
 * 第一个参数fils就是 这个模版下面的全部文件
 * 第二个参数ms就是元数据这里我们的问题以及回答会已键值对的形式存放在里面用于第二个插件渲染模版
 * 第三个参数就是类似 next的用法了 调用done后才能移交给下一个插件运行
 * ask函数则在另外一个js文件中
 */
function askQuestions (prompts) {
  return (fils, ms, done) => {
    ask(prompts, ms.metadata(), done)
  }
}

/**
 * render函数则是通过我们第一个插件收集这些问题以及回答后
 * 然后渲染我们的模版
 */
function renderTemplateFiles () {
  return (files, ms, done) => {
    const keys = Object.keys(files)  // 获取模版下的所有文件名
    keys.forEach(key => {  // 遍历对每个文件使用handlerbars渲染
      const str = files[key].contents.toString()
      let t = Handlebars.compile(str)
      let html = t(ms.metadata())
      files[key].contents = new Buffer.from(html)  // 渲染后重新写入到文件中
    })
    done() // 移交给下个插件
  }
}