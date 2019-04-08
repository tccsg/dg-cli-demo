# dg-cli-demo
这个demo我是模仿Vue-CLI 2.0写的一个简单的构建工具，3.0的源码还没去看，所以会有不同的地方。

[简书地址](https://www.jianshu.com/p/fe174b7eeee3)
#### 先安装开发依赖的工具
```npm
npm i commander handlebars inquirer metalsmith -D
```
```commander```：用来处理命令行参数

```handlerbars```：一个简单高效的语义化模板构建引擎，比如我们用vue-cli构建项目后命令行会有一些交互行为，让你选择要安装的包什么的等等，而Handlerbars.js会根据你的这些选择回答去渲染模版。

```inquirer```：会根据模版里面的meta.js或者meta.json文件中的设置，与用户进行一些简单的交互以确定项目的一些细节。

```metalsmith```：一个非常简单的可插拔的静态网站生成器，通过添加一些插件对要构建的模版文件进行处理。

安装完后就能在```package.json```中看到如下的依赖
![依赖](https://upload-images.jianshu.io/upload_images/6080408-1aa1d3b63f70522b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 项目目录结构
![image.png](https://upload-images.jianshu.io/upload_images/6080408-3047d7277fb2a5c8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

其中```template-demo```里面包含了本次要构建的项目模版templae，和meta.js文件

#### 代码编写
1.```bin/dg.js```之后在命令行下面运行
```node
node bin/dg.js xxx xxx
```
就可以构建项目了。
两个 xxx的地方 第一个是项目的模版，第二个是要输入到哪个目录下也就是要构建的项目名称
```javascript
// dg.js
const program = require('commander')
const path = require('path')
const chalk = require('chalk')  // 终端字体颜色
const inquirer = require('inquirer')
const exists = require('fs').existsSync // 判断 路径是否存在
const generate = require('./lib/generate')

/**
 * 注册一个help的命令
 * 当在终端输入 dg --help 或者没有跟参数的话
 * 会输出提示
 */
program.on('--help', () => {{
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    # create a new project with an template')) // 会以灰色字体显示
  console.log('    $ dg dgtemplate my-project')
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
    generate(rawName, tem, to, (err) => {
      if (err) console.log(err)  // 如果构建失败就调用的回调函数
    })
  }
}
```
注释说明 都在代码里面了。

2.接下来就是很重要的```lib/generate.js```文件了
```javascript
// generate.js
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
```
其实```generate.js```功能就是用来收集我们在命令行下交互的问题的答案用来渲染模版，只不过我这边只是简单的实现，在```vue-cli 2.0```中还有对文件的过滤，跳过不符合使用handlebars渲染文件，添加一些handlebars的helpers来制定文件渲染的规则等等
2. ```lib/options.js```
```javascript
// options.js
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
```
options我也是简单的实现，有兴趣的话可以查看```vue-cli```的源码

3. ```lib/ask.js```
```javascript
// ask.js
const async = require('async')  // 这是node下一个异步处理的工具
const inquirer = require('inquirer')

const promptMapping = {
  string: 'input'
}

/**
 * 这个函数就是 根据meta.js里面定义的prompts来与用户进行交互
 * 然后收集用户的交互信息存放在metadate 也就是metalsmith元数据中
 * 用于渲染模版使用
 */
module.exports = function ask (prompts, metadate, done) {
  async.eachSeries(Object.keys(prompts), (key, next) => {  // 这里不能简单的使用数组的 foreach方法 否则只直接跳到最后一个问题
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
```
收集问题的答案用于渲染模版

##### 下面是用于渲染模版的配置中的代码
为了方便 我把要渲染的模版，直接跟 构建工具 项目放到了同个文件夹下面，就是上面我截图的项目结构的 ```template-demo``` 里面包含了要渲染的模版 放在 ```template-demo/template```下面了，还包含了渲染模版的配置文件```meta.js```。
```javascript
// meta.js
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
```
主要是用于配置交互的问题，和再项目构建完成后执行的 complete 函数，这里就是 判断用户是否 选择了 自动安装依赖，如果```autoInstall```为true就自动安装依赖

```javascript
const spawn = require('child_process').spawn  // 一个node的子线程

/**
 * 安装依赖
 */
exports.installDependencies = function installDependencies(
  cwd,
  executable = 'npm',
  color
) {
  console.log(`\n\n# ${color('正在安装项目依赖 ...')}`)
  console.log('# ========================\n')
  return runCommand(executable, ['install'], {
    cwd,
  })
}


function runCommand(cmd, args, options) {
  return new Promise((resolve, reject) => {
    /**
     * 如果不清楚spaw的话可以上网查一下
     * 这里就是 在项目目录下执行 npm install
     */
    const spwan = spawn(
      cmd,
      args,
      Object.assign(
        {
          cwd: process.cwd(),
          stdio: 'inherit',
          shell: true, // 在shell下执行
        },
        options
      )
    )
    spwan.on('exit', () => {
      resolve()
    })
  })
}
```
执行安装的具体实现函数。

最后你就可以在构建工具的根目录下 执行
```
node bin/dg.js template-demo demo
```
来构建项目啦。
如果把```dg.js```添加到```$PATH```中 就可以 直接使用```dg template-demo demo```来构建项目。
![参数为空或者--helpe](https://upload-images.jianshu.io/upload_images/6080408-e77cae2ec000405e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![Boolean类型](https://upload-images.jianshu.io/upload_images/6080408-72be514bc57deeb6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![多选类型](https://upload-images.jianshu.io/upload_images/6080408-0efdcfe81e0de0ea.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![自动安装依赖](https://upload-images.jianshu.io/upload_images/6080408-14f8c8549927dc82.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![依赖安装完成](https://upload-images.jianshu.io/upload_images/6080408-610eb0ce217812b6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![demo就是我们构建的项目](https://upload-images.jianshu.io/upload_images/6080408-d6b2b95a8a4ea967.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![demo/package.json](https://upload-images.jianshu.io/upload_images/6080408-18192f9de969db9a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
最后我们可以看到我们在命令行回答的问题被渲染到了这里面来了，根据是否安装 ```dg-table```让这个插件出现在了依赖列表里面，当然包括模版中的```index.html```也被渲染了。这里图片就不贴出来了。这个模版只不过是为了演示没有其他意义了。


主要是我比较懒，挺多功能没实现，还有```vue-cli```可以自动从github上面拉取模版，```const download = require('download-git-repo')  //用于下载远程仓库至本地 支持GitHub、GitLab、Bitbucket```。

如果想更清楚的了解内部实现最好还是看下[Vue-cli2.0的源码](https://github.com/tccsg/vue-cli/tree/v2)。

