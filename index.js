#! /usr/bin/env node

const pkg = require('./package.json');
const { Command } = require('commander');
const userHome = require('userhome')();
const pathExists = require('path-exists');
const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');

const program = new Command();

async function core() {
    checkRoot();
    checkUserHome();
    registerCommand();
}

core();

function checkRoot() {
    const rootCheck = require('root-check');
    // $ 尝试降级具有root权限的进程的权限，如果失败，则阻止访问权限
    rootCheck();
}

function checkUserHome() {
    if (!(userHome && pathExists(userHome))) {
        throw new Error(colors.red(`当前登陆用户主目录不存在`));
    }
}

function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0]) //名称
        .usage('<command> [options]')  // 用法声明

    // $ 注册init命令
    program
        .command('create [projectName]')
        .option('-f --force', '是否强制初始化项目')
        .action(createProject);

    program.parse(process.argv);
    // $ 参数小于3个不解析，第一个是node 第二个是脚手架命令， 第三个才是option
    // if (process.argv.length < 3) {
    //   program.outputHelp();
    // }
    // $ args不存在前两个参数  -- node\akclown-cli
    if (program.args && program.args.length < 1) {
        program.outputHelp();
    }
}

async function createProject(projectName, options) {
    const localPath = process.cwd();
    if (!isCwdEmpty(localPath)) {
        // 1.1 询问是否继续创建
        let ifContinue = false;
        // $ 强制更新 - 不给予提示
        if (!options.force) {
            ifContinue = (
                await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件不为空，是否继续创建项目?',
                })
            ).ifContinue;
            if (!ifContinue) {
                return;
            }
        }
        if (ifContinue || options.force) {
            // $ 给用户做二次确认框
            const { confirmDelete } = await inquirer.prompt({
                type: 'confirm',
                name: 'confirmDelete',
                default: false,
                message: '是否确认清空当前目录下的文件?',
            });
            if (confirmDelete) {
                // $ 清空当前目录
                // fse.emptyDirSync(localPath);
            }
        }
    }

    projectTemplate = await inquirer.prompt([
        {
            type: 'list',
            name: 'projectTemplate',
            message: `请选择项目模板`,
            choices: [
                { value: 'react', name: 'react' },
                { value: 'babel', name: 'babel' },
                { value: 'vue', name: 'vue' }
            ],
        }
    ]);
    console.log('projectTemplate: ', projectTemplate);
    console.log('projectName: ', projectName);
}

// 判断当前目录是否为空
function isCwdEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    // 忽略掉.开头文件 以及 node_modules目录
    fileList = fileList.filter(
        file => !file.startsWith('.') && !['node_modules'].includes(file)
    );
    return !fileList || fileList.length <= 0;
}
