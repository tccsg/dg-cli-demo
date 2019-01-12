const { installDependencies } = require('./utils')
const path = require('path')


/***
 * 要交互的问题都放在 prompts中 
 * when是当什么情况下 用来判断是否 显示这个问题
 * type是提问的类型
 * message就是要显示的问题
 */
module.exports = {
  prompts: {
    name: {
      when: 'ismeta',
      type: 'string',
      message: '项目名称:'
    },
    description: {
      when: 'ismeta',
      type: 'string',
      message: '项目介绍:'
    },
    author: {
      when: 'ismeta',
      type: 'string',
      message: '项目作者:'
    },
    email: {
      when: 'ismeta',
      type: 'string',
      message: '邮箱:'
    },
    dgtable: {
      when: 'ismeta',
      type: 'confirm',
      message: '是否安装dg-table（笔者编写的基于elementui二次开发的强大的表格）',
    },
    genius: {
      when: 'ismeta',
      type: 'list',
      message: '想看想看？',
      choices: [
        {
          name: '想',
          value: '想',
          short: '想'
        },
        {
          name: '很想',
          value: '很想',
          short: '很想'
        }
      ]
    },
    autoInstall: {
      when: 'ismeta',
      type: 'confirm',
      message: '是否自动执行npm install 安装依赖？',
    },
  },
  complete: function(data, { chalk }) {
    /**
     * 用于判断是否执行自动安装依赖
     */
    const green = chalk.green // 取绿色
    const cwd = path.join(process.cwd(), data.inPlace ? '' : data.destDirName)
    if (data.autoInstall) {
      installDependencies(cwd, 'npm', green) // 这里使用npm安装
        .then(() => {
          console.log('依赖安装完成')
        })
        .catch(e => {
          console.log(chalk.red('Error:'), e)
        })
    } else {
      // printMessage(data, chalk)
    }
  }
}