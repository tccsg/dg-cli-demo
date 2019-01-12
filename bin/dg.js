const program = require('commander')
const path = require('path')
const chalk = require('chalk')  // 终端字体颜色
const inquirer = require('inquirer')
const exists = require('fs').existsSync // 判断 路径是否存在
const generate = require('../lib/generate')

/**
 * 注册一个help的命令
 * 当在终端输入 dg --help 或者没有跟参数的话
 * 会输出提示
 */
program.on('--help', () => {{
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    # create a new project with an template'))  // 会以灰色字体显示
  console.log('    $ node bin/dg.js dgtemplate my-project')
}})

/**
 * 判断参数是否为空
 * 如果为空调用上面注册的 help命令
 * 输出提示
 */
function help () {
  program.parse(process.argv)  //commander 用来处理 命令行里面的参数， 这边的process是node的一个全局变量不明白的可以查一下资料
  if (program.args.length < 1) return program.help()
}
help()

/**
 * 获取命令行参数
 */
let template = program.args[0] // 命令行第一个参数 模版的名字
const rawName = program.args[1] // 第二个参数 项目目录

/**
 * 获取项目和模版的完整路径
 */
const to = path.resolve(rawName) // 构建的项目的 绝对路径
const tem = path.join(process.cwd(), template) //模版的路径  cwd是当前运行的脚本是在哪个路径下运行
// console.log(tem)
/**
 * 判断这个项目路径是否存在也就是是否存在相同的项目名
 * 如果存在提示 是否继续然后运行 run
 * 如果不存在 则直接运行 run 最后会创建一个项目目录
 */
if (exists(to)) {
  inquirer.prompt([  // 这边就用到了与终端交互的inquirer了
    {
      type: 'confirm',
      message: 'Continue?',
      name: 'ok'
    }
  ]).then(answers => {
    if (answers.ok) {
      run ()
    }
  })
} else {
  run ()
}

/**
 * run函数则是用来调用generate来构建项目
 */
function run () {
  if (exists(tem)) {
    generate(rawName, tem, to, (err) => {  // 构建完成的回调函数
      if (err) console.log(err)  // 如果构建失败就输出失败原因
    })
  }
}