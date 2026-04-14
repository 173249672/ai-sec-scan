# 🛡️ AI Sec-Scan

[English](#english-version) | [中文版](#中文版)

[![npm version](https://img.shields.io/npm/v/ai-sec-scan.svg)](https://www.npmjs.com/package/ai-sec-scan)
[![npm downloads](https://img.shields.io/npm/dm/ai-sec-scan.svg)](https://www.npmjs.com/package/ai-sec-scan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

<h2 id="中文版">中文版</h2>

**AI Sec-Scan** 是一个兼容 Vue、React、Node.js 等项目的自动化代码安全扫描与审计工具。它结合了 **AST 静态语法分析**与 **通义千问大模型 (Qwen) 的 AI 语义深度分析**，深入审查代码中的潜在安全隐患，在大幅度降低误报率的同时，生成优美的可视化扫描报告。此外，它还可以结合 Git Hooks 在代码提交时拦截高风险代码。

### ✨ 核心特性

- **🚀 轻量级性能初筛**：利用 `@vue/compiler-sfc` 与 `@babel/parser` 解析代码 AST，定位如 `innerHTML`、`dangerouslySetInnerHTML`、`eval`、`exec` 等敏感 API 的使用情况，进行风险初筛。
- **🧠 AI 智能过滤误报 (支持多模型)**：基于标准 OpenAI 协议，不仅默认支持通义千问，你也可以轻松切换连接到 **DeepSeek** 或本地的 **Ollama**。AI 会结合完整上下文彻底排查控制流，精准分辨真实漏洞与正常业务逻辑。
- **⚡ AI 结果缓存系统**：内置基于文件内容与分析提示词的文件级 Hash 缓存！不变的代码将直接跳过 AI 扫描阶段，实现毫秒级复测，极大地节约扫描时间与 API 收费。
- **📊 优美的漏洞报告**：自动生成基于 HTML 与 Tailwind CSS 驱动的现代数据面板 (`audit-report.html`)，直观地展示风险详情、风险等级和精准的修复建议。
- **🧱 全栈语法分析支持**：完美兼容 Vue 2/3、React、Next.js、Nuxt 环境，以及原生 Node.js 后端代码体系，支持 `.vue`, `.js`, `.jsx`, `.ts`, `.tsx` 等主流拓展名分析检测。
- **🛡️ 增量提交防线拦截**：内置对 Husky 与 lint-staged 的支持，实现基于 Git 暂存区 (Staged) 代码的增量安全审计。一旦发现高危漏洞，将精准阻断 Git 提交，防止风险混入代码库。
- **🛠️ AI 自动修复 (--fix)**：针对确认为高危的漏洞点，AI 将尝试生成修复代码补丁。通过 `--fix` 参数，你可以一键将修复建议应用到源码，极大地缩短了「漏洞发现到修复」的周期。

### 📦 安装指南

请确保你的运行环境 Node.js 版本 `>= 18.0.0`。推荐将其作为项目的开发依赖 (devDependencies) 进行安装。

```bash
npm install -D ai-sec-scan
# 或者使用 yarn / pnpm
yarn add -D ai-sec-scan
pnpm add -D ai-sec-scan
```

如果是全局安装，也可以使用：
```bash
npm install -g ai-sec-scan
```

```env
QWEN_API_KEY=your_dashscope_api_key_here
```

### ⚙️ 高级配置 (可选)
对于需要深度定制的用户，可以在项目根目录创建 `ai-sec-scan.config.js`。你可以从 `ai-sec-scan.config.example.js` 复制并修改：

```javascript
module.exports = {
  ai: {
    // 只要模型兼容 OpenAI 协议均可使用
    // baseURL: 'https://api.deepseek.com/v1', // 使用 DeepSeek 时取消注释
    // baseURL: 'http://localhost:11434/v1',   // 使用本地 Ollama 时取消注释
    model: 'qwen3.5-plus',      // 指定模型 (如 deepseek-chat)
    temperature: 0.1,           // 逻辑温度
    // systemPrompt: '...'       // 自定义 AI 审计逻辑
  },
  scanner: {
    /**
     * 自定义 AST 扫描规则
     * 支持 property (属性), call (函数调用), jsxAttribute (JSX属性), vueInstruction (Vue指令)
     */
    customRules: [
      { 
        name: 'localStorage', 
        type: 'property', 
        message: '禁用的持久化存储 (localStorage)' 
      },
      {
        name: 'setTimeout',
        type: 'call',
        message: '异步代码执行风险 (setTimeout)'
      }
    ]
  }
};
```
配置优先级：`配置文件 > 环境变量 > 默认值`。

### 🚥 使用指南

工具提供了两种主要运行模式，你可以根据不同场景的需求进行选择：全量扫描与增量拦截模式。

#### 模式一：全量安全扫描

递归扫描并全面审计指定目录中的所有受支持代码文件，非常适用于项目代码的定期的整体例行安全体检。你可以通过 `npx` 或 npm scripts 直接调用：

```bash
npx ai-sec-scan ./src
# 或者
npx ai-sec-scan ./test-components
```

执行后工具将自动跳过 `node_modules`、`dist`、`tests` 等无关目录，并控制高并发访问发起 AI 深度分析。扫描完成后工具会自动调用默认浏览器为你展示分析面板 (`audit-report.html`)。

#### 模式三：结果导出 (--json)

你可以通过 `--json` 参数将扫描摘要和详细漏洞信息导出为 JSON 文件，极其方便 CI/CD 或第三方平台解析。

```bash
npx ai-sec-scan ./src --json audit-results.json
```

#### 模式四：AI 自动修复 (--fix)

针对扫描出的高危漏洞，你可以让 AI 尝试自动修复它们：

```bash
npx ai-sec-scan ./src --fix
```
**交互模式**：默认情况下，工具会逐个展示漏洞成因及修复前后的代码对比，并询问你是否应用修复。你可以选择应用 (`y`)、跳过 (`n`)、或者全部应用 (`all`)。

**静默模式**：如果你希望在 CI 中自动应用所有修复，可以加上 `--yes` 参数：
```bash
npx ai-sec-scan ./src --fix --yes
```
工具会针对每一个高危确认点，使用 AI 生成的安全代码替换掉原始的危险代码。**建议在执行前确保当前 Git 工作区是干净的，以便随时回滚。**

#### 模式二：结合 Git 的增量拦截 (-s 模式)

增量模式只检查你最近进行变更的代码（即 Git 暂存区中的文件）。你可以将它集成到 `lint-staged` 和 `husky` 的自动化工作流中，作为 `pre-commit` 钩子的安全拦截器。

**配置参考 (如 `package.json` 中的 `lint-staged` 配置):**
你可以直接使用以下配置集成到目前的自动化拦截流程：
```json
{
  "lint-staged": {
    "**/*.{vue,js,jsx,ts,tsx}": [
      "FORCE_COLOR=1 ai-sec-scan --staged"
    ]
  }
}
```

如果在暂存区的变动代码中，发现了经 AI 分析确认为「高危」的真实风险漏洞，控制台将输出红色警报，并执行退出码反制阻断提交进程：

```text
❌ [SECURITY BLOCKED] 暂存区存在 1 个高危漏洞，禁止提交！
```

### 🤝 参与贡献
欢迎提交 Issue 报告 Bug 或者提出各类功能建议。如果您希望开源并贡献代码，请先 Fork 本项目，然后提交 Pull Request。

### 📄 开源协议
本项目采用 [MIT License](./LICENSE) 协议进行开源，可以自由使用和修改。

---

<h2 id="english-version">English Version</h2>

**AI Sec-Scan** is an automated code security scanning and auditing tool compatible with projects running on Vue, React, Node.js, and more. It combines **AST static syntax analysis** with the **Qwen LLM AI semantic deep analysis** to deeply inspect potential security risks in the codebase. It dramatically reduces false positives while generating beautiful visual scan reports. Additionally, it can integrate with Git Hooks to intercept high-risk code during commits.

### ✨ Core Features

- **🚀 Lightweight Initial Screening**: Utilizes `@vue/compiler-sfc` and `@babel/parser` to parse code AST, locating the usage of sensitive APIs such as `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `exec`, etc., for preliminary risk screening.
- **🧠 AI Intelligent False-Positive Filtering (Multi-Model Support)**: Relying on the standard OpenAI protocol, it supports not only Qwen but also easily connects to **DeepSeek** or a local **Ollama** instance. The AI agent analyzes the data control flow within the full context to accurately separate real vulnerabilities from normal logic.
- **⚡ AI Results Caching System**: Built-in, file-level MD5 hashing cache (content + prompt hash)! Unchanged code bypasses the AI scanning phase entirely, enabling millisecond-level re-scans and massively saving API costs.
- **📊 Beautiful Vulnerability Reports**: Automatically generates a modern data dashboard (`audit-report.html`) powered by HTML and Tailwind CSS, intuitively displaying risk details, severity levels, and precise mitigation suggestions.
- **🧱 Full-Stack Code Support**: Perfectly compatible with Vue 2/3, React, Next.js, and Nuxt environments, as well as native Node.js backend code structures. It supports mainstream extensions such as `.vue`, `.js`, `.jsx`, `.ts`, and `.tsx`.
- **🛡️ Incremental Commit Defense**: Built-in support for Husky and `lint-staged` allows for incremental security audits based on Git Staged code. If a high-risk vulnerability is discovered, it accurately blocks the Git commit to prevent risks from entering the repository.
- **🛠️ AI Auto-Fixing (--fix)**: For confirmed high-risk vulnerabilities, AI will attempt to generate code patches. With the `--fix` parameter, you can apply these remediation suggestions to your source code with a single command, significantly shortening the "vulnerability-to-fix" cycle.

### 📦 Installation

Please ensure your Node.js runtime environment is `>= 18.0.0`. It's recommended to install it as a development dependency.

```bash
npm install -D ai-sec-scan
# Or using yarn / pnpm
yarn add -D ai-sec-scan
pnpm add -D ai-sec-scan
```

For global installation:
```bash
npm install -g ai-sec-scan
```

```env
QWEN_API_KEY=your_dashscope_api_key_here
```

### ⚙️ Advanced Configuration (Optional)
For users requiring deeper customization, create an `ai-sec-scan.config.js` in the project root. You can copy it from `ai-sec-scan.config.example.js`:

```javascript
module.exports = {
  ai: {
    // Compatible with any model supporting the OpenAI protocol
    // baseURL: 'https://api.deepseek.com/v1', // Uncomment for DeepSeek
    // baseURL: 'http://localhost:11434/v1',   // Uncomment for local Ollama
    model: 'qwen3.5-plus',      // Specify AI model
    temperature: 0.1,           // Sampling temperature
    // systemPrompt: '...'       // Custom AI auditing logic
  },
  scanner: {
    /**
     * Custom AST scanning rules
     * Supports property, call, jsxAttribute, vueInstruction
     */
    customRules: [
      { 
        name: 'localStorage', 
        type: 'property', 
        message: 'Disabled Persistent Storage (localStorage)' 
      }
    ]
  }
};
```
Precedence: `Config File > Environment Variables > Default Values`.

### 🚥 Usage Guide

The tool offers two main execution modes: Full-Scan Mode and Incremental Interception Mode.

#### Mode 1: Full Security Scan

Recursively scans and comprehensively audits all supported code files in specific directories. Recommended for routine, overall security health checks of project code. 

```bash
npx ai-sec-scan ./src
# Or
npx ai-sec-scan ./test-components
```

Once executed, the tool automatically skips irrelevant folders like `node_modules`, `dist`, and `tests`. It also manages concurrency while initiating deep AI analysis. Upon completion, the tool will automatically open your default browser to display the analysis dashboard (`audit-report.html`).

#### Mode 3: Result Export (--json)

You can export the scan summary and detailed vulnerability information into a JSON file using the `--json` parameter, which is convenient for CI/CD or 3rd-party platform parsing.

```bash
npx ai-sec-scan ./src --json audit-results.json
```

#### Mode 4: AI Auto-Fixing (--fix)

For high-risk vulnerabilities discovered during the scan, you can have the AI attempt to fix them automatically:

```bash
npx ai-sec-scan ./src --fix
```
**Interactive Mode**: By default, the tool will display the reason for each vulnerability and a code diff, asking for your confirmation. You can choose to apply (`y`), skip (`n`), or apply all (`all`).

**Silent Mode**: If you want to automatically apply all fixes in CI, use the `--yes` flag:
```bash
npx ai-sec-scan ./src --fix --yes
```
The tool will replace the original dangerous code with AI-generated secure code. **It is recommended to ensure your Git workspace is clean before execution so you can revert anytime.**

#### Mode 2: Incremental Interception via Git Hooks (-s flag)

Incremental mode only inspects the code you've recently modified (i.e., files in the Git staging area). You can integrate it into automation workflows like `lint-staged` and `husky` as a security interceptor for the `pre-commit` hook.

**Configuration Example (for `lint-staged` in `package.json`):**
```json
{
  "lint-staged": {
    "**/*.{vue,js,jsx,ts,tsx}": [
      "FORCE_COLOR=1 ai-sec-scan --staged"
    ]
  }
}
```

If the AI identifies a genuine "high-risk" vulnerability within the modified staged files, the console will output a red alert and block the commit process:

```text
❌ [SECURITY BLOCKED] 1 high-risk vulnerability found in the staging area. Commit blocked!
```

### 🤝 Contributing
Issues and Pull Requests are welcome! Feel free to report any bug or suggest new features by opening an issue first.

### 📄 License
This project is licensed under the [MIT License](./LICENSE).

---
*Powered by Deep Security Scanning Engine & AI Assurance.*
