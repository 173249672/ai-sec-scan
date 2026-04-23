#!/usr/bin/env node
require('dotenv').config();
const { program } = require('commander');
const fg = require('fast-glob');
const ora = require('ora');
const chalk = require('chalk');
const pLimit = require('p-limit');
const fs = require('fs');
const path = require('path');
const open = require('open');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

// 导入我们重构后的模块
const { scanFile } = require('../lib/ast-scanner');
const { analyzeWithQwen } = require('../lib/ai-auditor');
const { CacheManager } = require('../lib/cache-manager');
const { loadConfig } = require('../lib/config-loader');
/**
 * 生成漂亮的 HTML 报告模板
 */
function generateHtmlReport(data) {
  const { summary, details, scanTime } = data;

  const categoryStyles = {
    injections: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    xss: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    secrets: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    potential_xss: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    dynamic_regex: 'bg-violet-500/10 border-violet-500/20 text-violet-400'
  };

  const cards = details.map((item, idx) => {
    let style = categoryStyles[item.category] || 'bg-slate-800/50 border-slate-700 text-slate-300';
    const escapedSuggestion = item.suggestion.replace(/`/g, "\\`").replace(/'/g, "\\'").replace(/\n/g, "<br>");
    
    return `
      <div id="card-${idx}" class="vulnerability-card group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
        <div class="flex justify-between items-start mb-6">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${style}">
                ${item.category || 'Vulnerability'}
              </span>
              <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.riskLevel === 'High' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}">
                ${item.riskLevel}
              </span>
            </div>
            <h3 class="text-xl font-bold text-white mt-4 group-hover:text-indigo-400 transition-colors">${item.file}</h3>
          </div>
          <div onclick="toggleLock(${idx})" class="lock-btn cursor-pointer bg-slate-800/50 p-3 rounded-2xl hover:bg-slate-700 transition-all active:scale-90 group-hover:border-amber-500/30 border border-transparent">
             <svg class="lock-icon w-6 h-6 text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
        </div>

        <div class="space-y-6">
          <div class="min-h-[80px]">
            <p class="text-slate-400 text-sm leading-relaxed">${item.reason}</p>
          </div>
          
          <div class="pt-4 flex items-center gap-4">
             <button onclick="showDetails('${item.file.replace(/'/g, "\\'")}', \`${escapedSuggestion}\`)" class="details-btn px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95" data-i18n="btnDetails">View Details</button>
             <button onclick="toggleIgnore(${idx})" class="ignore-btn px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-all active:scale-95" data-i18n="btnIgnore">Ignore</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en" class="dark">
    <head>
      <meta charset="UTF-8">
      <title>🛡️ AI Sec-Scan | Premium Audit Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(24px); }
        .card-ignored { opacity: 0.4; filter: grayscale(1); pointer-events: none; }
        .card-ignored .ignore-btn { pointer-events: auto !important; }
        
        /* Locked State */
        .card-locked { border-color: rgba(245, 158, 11, 0.4) !important; box-shadow: 0 10px 40px -10px rgba(245, 158, 11, 0.1); }
        .card-locked .ignore-btn { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      </style>
    </head>
    <body class="bg-[#020617] text-slate-300 min-h-screen selection:bg-indigo-500/30">
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div class="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-6 py-16">
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h1 class="text-4xl font-extrabold tracking-tight text-white">AI Sec-Scan</h1>
            </div>
            <p class="text-slate-400 text-lg max-w-2xl font-medium" data-i18n="headerDesc">Enterprise-grade security audit powered by <span class="text-indigo-400">Deep-AST</span> & <span class="text-indigo-400">Advanced AI</span> models.</p>
          </div>
          
          <div class="flex flex-col items-end gap-6">
            <!-- Language Toggle -->
            <div class="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 backdrop-blur-md">
              <button onclick="setLang('en')" id="lang-en" class="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white">EN</button>
              <button onclick="setLang('zh')" id="lang-zh" class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-300">中文</button>
            </div>
            <div class="flex flex-col items-end gap-1">
               <span class="px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-400 tracking-widest uppercase" data-i18n="generated">Report Generated</span>
               <time class="text-lg font-bold text-white">${new Date(scanTime).toLocaleDateString()} ${new Date(scanTime).toLocaleTimeString()}</time>
            </div>
          </div>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          <div class="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-2">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest" data-i18n="statAudited">Files Audited</p>
            <p class="text-4xl font-black text-white">${summary.totalScanned}</p>
          </div>
          <div class="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-2 border-l-4 border-l-amber-500">
            <p class="text-xs font-bold text-amber-500/60 uppercase tracking-widest" data-i18n="statSuspects">AST Suspects</p>
            <p class="text-4xl font-black text-amber-500">${summary.suspiciousDetected}</p>
          </div>
          <div class="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
            <p class="text-xs font-bold text-rose-500/60 uppercase tracking-widest" data-i18n="statCritical">Confirmed Critical</p>
            <p class="text-4xl font-black text-rose-500">${summary.aiConfirmedHigh}</p>
          </div>
          <div class="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
            <p class="text-xs font-bold text-emerald-500/60 uppercase tracking-widest" data-i18n="statSafe">False Positives</p>
            <p class="text-4xl font-black text-emerald-500">${summary.aiConfirmedSafe}</p>
          </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
          ${cards}
        </section>
        
        <footer class="mt-32 pt-12 border-t border-slate-800 text-center">
          <p class="text-slate-500 text-sm font-medium tracking-wide">© 2026 AI Sec-Scan Audit Engine. All rights reserved.</p>
        </footer>
      </div>

      <!-- Detail Modal -->
      <div id="modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-6 bg-[#020617]/80 backdrop-blur-md">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-3xl overflow-hidden animate-fade-in">
          <div class="p-8 border-b border-slate-800 flex justify-between items-center">
            <h3 id="modal-title" class="text-xl font-bold text-white">Vulnerability Details</h3>
            <button onclick="closeModal()" class="text-slate-500 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-widest" data-i18n="fixSuggestion">Remediation Suggestion</h4>
              <p id="modal-content" class="text-slate-300 leading-relaxed text-sm"></p>
            </div>
          </div>
          <div class="p-8 bg-slate-950/50 flex justify-end">
            <button onclick="closeModal()" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all" data-i18n="btnClose">Close</button>
          </div>
        </div>
      </div>

      <script>
        const i18n = {
          en: {
            headerDesc: 'Enterprise-grade security audit powered by <span class="text-indigo-400">Deep-AST</span> & <span class="text-indigo-400">Advanced AI</span> models.',
            generated: 'Report Generated',
            statAudited: 'Files Audited',
            statSuspects: 'AST Suspects',
            statCritical: 'Confirmed Critical',
            statSafe: 'False Positives',
            issue: 'Security Issue',
            btnDetails: 'View Details',
            btnIgnore: 'Ignore',
            btnUndo: 'Undo',
            fixSuggestion: 'Remediation Suggestion',
            btnClose: 'Close'
          },
          zh: {
            headerDesc: '由 <span class="text-indigo-400">Deep-AST</span> 与 <span class="text-indigo-400">高级 AI</span> 模型驱动的企业级安全审计。',
            generated: '报告生成时间',
            statAudited: '已扫描文件',
            statSuspects: 'AST 嫌疑点',
            statCritical: '确认高危',
            statSafe: '排除误报',
            issue: '安全风险',
            btnDetails: '查看详情',
            btnIgnore: '忽略',
            btnUndo: '撤回',
            fixSuggestion: '修复建议详情',
            btnClose: '关闭'
          }
        };

        let currentLang = 'en';

        function setLang(lang) {
          currentLang = lang;
          document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.innerHTML = i18n[lang][key];
          });
          
          document.getElementById('lang-en').className = lang === 'en' ? 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white' : 'px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-300';
          document.getElementById('lang-zh').className = lang === 'zh' ? 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white' : 'px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-300';
        }

        function toggleLock(idx) {
          const card = document.getElementById('card-' + idx);
          const icon = card.querySelector('.lock-icon');
          const isLocked = card.classList.toggle('card-locked');
          
          if (isLocked) {
            icon.classList.remove('text-slate-400');
            icon.classList.add('text-amber-400');
          } else {
            icon.classList.add('text-slate-400');
            icon.classList.remove('text-amber-400');
          }
        }

        function toggleIgnore(idx) {
          const card = document.getElementById('card-' + idx);
          if (card.classList.contains('card-locked')) return;

          const btn = card.querySelector('.ignore-btn');
          const isIgnored = card.classList.contains('card-ignored');
          
          if (isIgnored) {
            card.classList.remove('card-ignored');
            btn.innerHTML = i18n[currentLang].btnIgnore;
          } else {
            card.classList.add('card-ignored');
            btn.innerHTML = i18n[currentLang].btnUndo;
          }
        }

        function showDetails(file, content) {
          document.getElementById('modal-title').innerText = file;
          document.getElementById('modal-content').innerHTML = content;
          document.getElementById('modal').classList.remove('hidden');
        }

        function closeModal() {
          document.getElementById('modal').classList.add('hidden');
        }

        // Close modal on escape
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeModal();
        });
      </script>
    </body>
    </html>
  `;
}

program.version(require('../package.json').version);

program
  .command('init')
  .description('✨ 交互式初始化向导：快速配置 AI 模型与 Husky 拦截防线')
  .action(async () => {
    const { runWizard } = require('../lib/init-wizard');
    await runWizard();
  });

program
  .command('scan [dir]', { isDefault: true })
  .description('兼容 Vue/React/Node 的 AI 自动化安全扫描工具')
  .option('-s, --staged', '增量模式 (只扫描 Git 暂存区)')
  .option('--json <path>', '导出扫描结果到 JSON 文件')
  .option('--fix', '自动应用针对高危漏洞的 AI 修复建议')
  .option('--yes', '静默执行，直接应用所有修复（不进行交互式确认）')
  .action(async (dir, options) => {
    // 如果 dir 为空，默认为 .
    const targetPath = dir || '.';
    const startTime = Date.now();
    let files = [];
    const config = loadConfig();

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
      if (!fs.existsSync(targetPath)) {
        return console.log(chalk.red(`❌ 路径不存在: ${targetPath}`));
      }

      const stats = fs.statSync(targetPath);
      if (stats.isFile()) {
        console.log(chalk.blue(`📌 模式: 单文件扫描 [${targetPath}]`));
        files = [targetPath];
      } else {
        console.log(chalk.blue(`📌 模式: 目录扫描 [${targetPath}]`));
        files = fg.sync(path.join(targetPath, '**/*.{vue,js,jsx,ts,tsx}'), {
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/tests/**']
        });
      }
    }

    // --- 2. AST 初筛 ---
    const suspiciousFiles = [];
    files.forEach(file => {
      const scanResult = scanFile(file, config);
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
      aiCachedHits: 0,
      aiConfirmedHigh: 0,
      aiConfirmedSafe: 0,
      failedRequests: 0
    };
    const cacheManager = new CacheManager();
    const auditDetails = [];

    let processedCount = 0;
    const totalToAudit = suspiciousFiles.length;

    const tasks = suspiciousFiles.map(item => limit(async () => {
      processedCount++;
      const spinner = ora(chalk.gray(`[${processedCount}/${totalToAudit}] 分析 ${item.file}...`)).start();
      try {
        const report = await analyzeWithQwen(item.file, item, cacheManager);
        spinner.stop();

        auditDetails.push({ file: item.file, ...report });

        const fromCacheMsg = report._cached ? chalk.gray(' (缓存命中)') : '';

        if (report.riskLevel === 'High') {
          summary.aiConfirmedHigh++;
          console.log(chalk.red(`  🚨 [高危] ${item.file}`) + fromCacheMsg);
        } else {
          summary.aiConfirmedSafe++;
          console.log(chalk.green(`  ✅ [安全] ${item.file}`) + fromCacheMsg);
        }

        if (report._cached) {
           summary.aiCachedHits++;
        }
      } catch (err) {
        summary.failedRequests++;
        spinner.fail(chalk.red(`  ❌ 分析失败: ${item.file} (${err.message})`));
      }
    }));

    await Promise.all(tasks);

    cacheManager.save();

    // --- 4. 生成报告 ---
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const reportData = {
      scanTime: new Date().toISOString(),
      summary,
      details: auditDetails
    };

    const reportPath = './audit-report.html';
    fs.writeFileSync(reportPath, generateHtmlReport(reportData));

    if (options.json) {
      fs.writeFileSync(options.json, JSON.stringify(reportData, null, 2), 'utf-8');
      console.log(chalk.green(`\n📊 JSON 报告已导出至: ${options.json}`));
    }

    // --- 5. 打印摘要 ---
    console.log(chalk.cyan('\n' + '='.repeat(40)));
    console.log(chalk.cyan.bold('         审计任务完成摘要'));
    console.log(chalk.cyan('='.repeat(40)));
    console.log(`⏱️  总耗时:     ${duration}s`);
    console.log(`📂 扫描文件:   ${summary.totalScanned}`);
    console.log(`🔍 AST 嫌疑点: ${summary.suspiciousDetected}`);
    console.log(`⚡ API 缓存命中: ${summary.aiCachedHits}`);
    console.log(chalk.red(`🚨 AI 确认高危: ${summary.aiConfirmedHigh}`));
    console.log(chalk.green(`🛡️  AI 排除误报: ${summary.aiConfirmedSafe}`));
    console.log(chalk.cyan('='.repeat(40)));

    console.log(chalk.blue(`\n🌐 详细报告已保存并尝试自动打开: ${reportPath}`));
    await open(reportPath);

    if (options.fix && summary.aiConfirmedHigh > 0) {
      console.log(chalk.yellow.bold('\n🛠️  启动 AI 自动修复程序...'));
      const fixCount = await applyFixes(auditDetails, suspiciousFiles, options.yes);
      console.log(chalk.green.bold(`✨ 修复完成！本轮共修复了 ${fixCount} 个高危漏洞点。`));
      console.log(chalk.gray('请检查代码变更并运行测试以确保系统稳定性。\n'));
    }

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

/**
 * 自动修复核心逻辑 (交互式)
 */
async function applyFixes(auditDetails, suspiciousFiles, skipConfirm = false) {
  let count = 0;
  let applyAllRemaining = skipConfirm;
  
  // 1. 按文件归类漏洞点
  const fileFixes = {};
  auditDetails.forEach(detail => {
    if (detail.riskLevel === 'High' && detail.fixCode) {
      if (!fileFixes[detail.file]) fileFixes[detail.file] = [];
      const original = suspiciousFiles.find(s => s.file === detail.file);
      if (original && original.sinks) {
        original.sinks.forEach((sink, idx) => {
          let specificFix = '';
          
          // 如果是对象格式，按 1-indexed 索引取值
          if (typeof detail.fixCode === 'object') {
            specificFix = detail.fixCode[String(idx + 1)] || detail.fixCode[idx];
          } else {
            // 如果是字符串，则视为通用修复或单点修复
            specificFix = detail.fixCode;
          }

          if (specificFix && specificFix.trim() !== '') {
            fileFixes[detail.file].push({
              reason: detail.reason,
              start: sink.start,
              end: sink.end,
              oldCode: sink.codeSnippet,
              fixCode: specificFix
            });
          }
        });
      }
    }
  });

  // 2. 逐个文件应用修复
  const files = Object.keys(fileFixes);
  for (const filePath of files) {
    const sortedFixes = fileFixes[filePath].sort((a, b) => b.start - a.start);
    let currentContent = fs.readFileSync(filePath, 'utf-8');
    let fileHasChanges = false;

    console.log(chalk.blue(`\n📂 正在处理: ${filePath}`));

    for (const fix of sortedFixes) {
      if (!applyAllRemaining) {
        console.log(chalk.cyan('\n----------------------------------------'));
        console.log(chalk.yellow(`漏洞原因: ${fix.reason}`));
        console.log(chalk.red(`[-] 源码: ${fix.oldCode.trim()}`));
        console.log(chalk.green(`[+] 修复: ${fix.fixCode.trim()}`));
        console.log(chalk.cyan('----------------------------------------'));
        
        const answer = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: '是否应用此 AI 修复建议?',
          choices: [
            { name: '✅ 是 (Apply)', value: 'yes' },
            { name: '⏭️ 跳过 (Skip)', value: 'no' },
            { name: '🚀 全部应用 (All)', value: 'all' },
            { name: '🛑 退出 (Quit)', value: 'quit' }
          ]
        }]);

        if (answer.action === 'quit') return count;
        if (answer.action === 'no') continue;
        if (answer.action === 'all') applyAllRemaining = true;
      }

      // 执行替换逻辑
      const actualStart = fix.start;
      const actualEnd = fix.end;
      currentContent = currentContent.slice(0, actualStart) + fix.fixCode + currentContent.slice(actualEnd);
      fileHasChanges = true;
      count++;
      
      if (!applyAllRemaining) {
        console.log(chalk.green(`  ✔️ 已应用修复`));
      }
    }

    if (fileHasChanges) {
      fs.writeFileSync(filePath, currentContent, 'utf-8');
    }
  }

  return count;
}


program.parseAsync(process.argv);
