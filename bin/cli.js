#!/usr/bin/env node
require('dotenv').config();
const { program } = require('commander');
const fg = require('fast-glob');
const ora = require('ora');
const chalk = require('chalk');
const pLimit = require('p-limit');
const fs = require('fs');
const open = require('open');
const { execSync } = require('child_process');

// 导入我们重构后的模块
const { scanFile } = require('../lib/ast-scanner');
const { analyzeWithQwen } = require('../lib/ai-auditor');
/**
 * 生成漂亮的 HTML 报告模板
 */
function generateHtmlReport(data) {
  const { summary, details, scanTime } = data;
  const rows = details.map(item => `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 font-mono text-sm">${item.file}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded text-xs font-bold ${item.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
          ${item.riskLevel}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">${item.reason}</td>
      <td class="px-4 py-3 text-sm font-mono bg-gray-50 p-2 rounded border">${item.suggestion.replace(/</g, '&lt;')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>全栈安全审计报告</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 p-8 font-sans">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">🛡️ AI Sec-Scan</h1>
            <p class="text-slate-500 mt-2 text-lg">全栈代码安全审计报告 | 生成时间: ${new Date(scanTime).toLocaleString()}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="text-slate-400 text-sm font-semibold uppercase tracking-wider">已扫描文件</div>
            <div class="text-3xl font-bold text-slate-800 mt-1">${summary.totalScanned}</div>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-400">
            <div class="text-slate-400 text-sm font-semibold uppercase tracking-wider">AST 嫌疑点</div>
            <div class="text-3xl font-bold text-amber-600 mt-1">${summary.suspiciousDetected}</div>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-rose-500">
            <div class="text-slate-400 text-sm font-semibold uppercase tracking-wider">AI 确认高危</div>
            <div class="text-3xl font-bold text-rose-600 mt-1">${summary.aiConfirmedHigh}</div>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <div class="text-slate-400 text-sm font-semibold uppercase tracking-wider">AI 排除误报</div>
            <div class="text-3xl font-bold text-emerald-600 mt-1">${summary.aiConfirmedSafe}</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-800 text-slate-100">
              <tr>
                <th class="px-6 py-4 font-semibold">文件路径</th>
                <th class="px-6 py-4 font-semibold">风险等级</th>
                <th class="px-6 py-4 font-semibold">审计结论</th>
                <th class="px-6 py-4 font-semibold">修复建议</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">${rows}</tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}

program
  .name('ai-sec-scan')
  .description('兼容 Vue/React/Node 的 AI 自动化安全扫描工具')
  .argument('[dir]', '指定扫描目录 (全量模式)')
  .option('-s, --staged', '增量模式 (只扫描 Git 暂存区)')
  .action(async (dir, options) => {
    const startTime = Date.now();
    let files = [];

    console.log(chalk.cyan.bold('\n🚀 AI Sec-Scan 启动...'));

    // --- 1. 获取目标文件 ---
    if (options.staged) {
      console.log(chalk.blue('📌 模式: Git 增量扫描'));
      try {
        const stdout = execSync('git diff --name-only --cached', { encoding: 'utf-8' });
        files = stdout
          .split('\n')
          .map(f => f.trim())
          .filter(f => /\.(vue|js|jsx|ts|tsx)$/.test(f));

        if (files.length === 0) {
          return console.log(chalk.green('ℹ️ 暂存区没有发现受支持的代码文件。'));
        }
      } catch (e) {
        console.error(chalk.red('❌ 获取 Git 状态失败，请确保在 Git 项目中运行。'));
        process.exit(1);
      }
    } else {
      if (!dir) return console.log(chalk.red('❌ 全量模式下必须指定目录 (如: node index.js ./src)'));
      console.log(chalk.blue(`📌 模式: 全量扫描 [${dir}]`));
      files = await fg([`${dir}/**/*.{vue,js,jsx,ts,tsx}`], {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/tests/**']
      });
    }

    // --- 2. AST 初筛 ---
    const suspiciousFiles = [];
    files.forEach(file => {
      const scanResult = scanFile(file);
      if (scanResult) suspiciousFiles.push({ file, ...scanResult });
    });

    if (suspiciousFiles.length === 0) {
      console.log(chalk.green.bold('✅ 恭喜！AST 未发现任何可疑代码。'));
      return;
    }

    console.log(chalk.yellow(`⚠️ 发现 ${suspiciousFiles.length} 个可疑位置，正在发起 AI 深度审计...`));

    // --- 3. AI 审计与并发控制 ---
    const limit = pLimit(3); // 限制并发，防止 API 429
    const summary = {
      totalScanned: files.length,
      suspiciousDetected: suspiciousFiles.length,
      aiConfirmedHigh: 0,
      aiConfirmedSafe: 0,
      failedRequests: 0
    };
    const auditDetails = [];

    const tasks = suspiciousFiles.map(item => limit(async () => {
      const spinner = ora(chalk.gray(`分析 ${item.file}...`)).start();
      try {
        const report = await analyzeWithQwen(item.file, item);
        spinner.stop();

        auditDetails.push({ file: item.file, ...report });

        if (report.riskLevel === 'High') {
          summary.aiConfirmedHigh++;
          console.log(chalk.red(`  🚨 [高危] ${item.file}`));
        } else {
          summary.aiConfirmedSafe++;
          console.log(chalk.green(`  ✅ [安全] ${item.file}`));
        }
      } catch (err) {
        summary.failedRequests++;
        spinner.fail(chalk.red(`  ❌ 分析失败: ${item.file} (${err.message})`));
      }
    }));

    await Promise.all(tasks);

    // --- 4. 生成报告 ---
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const reportData = {
      scanTime: new Date().toISOString(),
      summary,
      details: auditDetails
    };

    const reportPath = './audit-report.html';
    fs.writeFileSync(reportPath, generateHtmlReport(reportData));

    // --- 5. 打印摘要 ---
    console.log(chalk.cyan('\n' + '='.repeat(40)));
    console.log(chalk.cyan.bold('         审计任务完成摘要'));
    console.log(chalk.cyan('='.repeat(40)));
    console.log(`⏱️  总耗时:     ${duration}s`);
    console.log(`📂 扫描文件:   ${summary.totalScanned}`);
    console.log(`🔍 AST 嫌疑点: ${summary.suspiciousDetected}`);
    console.log(chalk.red(`🚨 AI 确认高危: ${summary.aiConfirmedHigh}`));
    console.log(chalk.green(`🛡️  AI 排除误报: ${summary.aiConfirmedSafe}`));
    console.log(chalk.cyan('='.repeat(40)));

    console.log(chalk.blue(`\n🌐 详细报告已保存并尝试自动打开: ${reportPath}`));
    await open(reportPath);

    // --- 6. 核心：Git 拦截逻辑 ---
    if (options.staged) {
      if (summary.aiConfirmedHigh > 0) {
        console.error(chalk.red.bold(`\n❌ [SECURITY BLOCKED] 暂存区存在 ${summary.aiConfirmedHigh} 个高危漏洞，禁止提交！\n`));
        process.exit(1);
      } else {
        console.log(chalk.green.bold('\n✨ 增量代码安全校验通过，准予通行！\n'));
        process.exit(0);
      }
    }
  });

program.parseAsync(process.argv);
