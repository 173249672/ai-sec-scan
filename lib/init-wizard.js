const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

async function runWizard() {
  console.log(chalk.cyan.bold('\n✨ 欢迎使用 AI Sec-Scan 初始化向导 ✨\n'));

  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red('❌ 错误: 当前目录下未找到 package.json 文件。'));
    console.log(chalk.yellow('提示: 请在项目的根目录下运行此命令。'));
    process.exit(1);
  }

  // 第一阶段：CI/CD 拦截钩子配置
  const huskyAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupHusky',
      message: '🛡️ 是否为您自动配置 Git 提交拦截？(基于 Husky 和 lint-staged，在 commit 时阻断高危代码)',
      default: true
    }
  ]);

  if (huskyAnswer.setupHusky) {
    console.log(chalk.blue('\n📦 正在为您安装并配置 husky 与 lint-staged，这可能需要一点时间...'));
    try {
      execSync('npm install -D husky lint-staged', { stdio: 'inherit' });
      
      // 更新 package.json 插入 lint-staged 配置
      const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgRaw);
      pkg['lint-staged'] = pkg['lint-staged'] || {};
      pkg['lint-staged']['**/*.{vue,js,jsx,ts,tsx}'] = ["ai-sec-scan --staged"];
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log(chalk.green('✅ package.json 已更新 lint-staged 配置！'));

      // 配置 husky
      execSync('npx husky install', { stdio: 'inherit' });
      // 生成 pre-commit 钩子文件
      const precommitPath = path.join(cwd, '.husky', 'pre-commit');
      fs.writeFileSync(precommitPath, `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-staged\n`, { mode: 0o755 });
      console.log(chalk.green('✅ Husky Git Hook 创建成功！'));
    } catch (e) {
      console.error(chalk.red('\n❌ Husky 安装或配置过程中发生错误，请稍后手动检查。'), e.message);
    }
  }

  // 第二阶段：AI 模型配置
  console.log(chalk.cyan('\n----------------------------------------\n'));
  const aiAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'modelProvider',
      message: '🧠 请选择您想要使用的 AI 驱动引擎：',
      choices: [
        { name: '通义千问 Qwen (默认推荐, 快速精准)', value: 'qwen' },
        { name: 'DeepSeek (高性价比)', value: 'deepseek' },
        { name: 'Ollama (本地免费部署)', value: 'ollama' },
        { name: '自定义接入 (需兼容 OpenAI 协议)', value: 'custom' }
      ]
    },
    {
      type: 'input',
      name: 'apiKey',
      message: '🔑 请输入您的 API Key:',
      when: (answers) => answers.modelProvider !== 'ollama'
    },
    {
      type: 'confirm',
      name: 'useCustomPrompt',
      message: '🧪 是否开启「专家模式」？(允许自定义 AI 的系统提示词 Prompt)',
      default: false
    },
    {
      type: 'editor',
      name: 'customPrompt',
      message: '✍️ 请编辑您的自定义 System Prompt:',
      default: 'You are an expert security engineer. Analyze the code and provide a JSON fix...',
      when: (answers) => answers.useCustomPrompt
    }
  ]);

  // 生成配置文件
  let configContent = `/**\n * AI Sec-Scan 配置文件\n */\n\nmodule.exports = {\n  ai: {\n`;
  
  if (aiAnswer.modelProvider === 'qwen') {
    configContent += `    model: 'qwen3.5-plus',\n    baseURL: 'https://coding.dashscope.aliyuncs.com/v1',\n`;
  } else if (aiAnswer.modelProvider === 'deepseek') {
    configContent += `    model: 'deepseek-chat',\n    baseURL: 'https://api.deepseek.com/v1',\n`;
  } else if (aiAnswer.modelProvider === 'ollama') {
    configContent += `    model: 'llama3',\n    baseURL: 'http://localhost:11434/v1',\n`;
  } else {
    configContent += `    model: 'YOUR_MODEL_NAME',\n    baseURL: 'YOUR_CUSTOM_URL',\n`;
  }
  
  configContent += `    temperature: 0.1,\n`;
  if (aiAnswer.useCustomPrompt) {
    configContent += `    systemPrompt: \`${aiAnswer.customPrompt.replace(/`/g, '\\`').trim()}\`\n`;
  }
  configContent += `  }\n};\n`;

  const configPath = path.join(cwd, 'ai-sec-scan.config.js');
  fs.writeFileSync(configPath, configContent);
  console.log(chalk.green(`\n✅ 已生成配置文件: ai-sec-scan.config.js`));

  // 处理环境变量保护
  if (aiAnswer.apiKey) {
    const envPath = path.join(cwd, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('QWEN_API_KEY')) {
        envContent += `\nQWEN_API_KEY=${aiAnswer.apiKey}\n`;
        fs.writeFileSync(envPath, envContent);
      } else {
        console.log(chalk.yellow('⚠️ .env 文件中已有 QWEN_API_KEY，跳过写入。'));
      }
    } else {
      fs.writeFileSync(envPath, `QWEN_API_KEY=${aiAnswer.apiKey}\n`);
    }
    console.log(chalk.green('✅ API 密钥已写入 .env'));

    // 确保 .env 在 .gitignore 中
    const gitignorePath = path.join(cwd, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const igContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!igContent.split('\n').some(line => line.trim() === '.env')) {
        fs.appendFileSync(gitignorePath, '\n# Credentials\n.env\n');
        console.log(chalk.green('✅ 已将 .env 自动添加到 .gitignore 中。'));
      }
    }
  }

  console.log(chalk.green.bold('\n🎉 全置完成！您现在可以放心地编写代码了，安全拦截防线已就绪。'));
  console.log(chalk.gray('  提示: 尝试运行 `npx ai-sec-scan ./src` 发起首次全量体检。'));
}

module.exports = { runWizard };
