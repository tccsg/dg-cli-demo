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