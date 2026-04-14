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
- **🧠 AI 智能过滤误报**：将初筛出的疑点结合完整上下文代码，交给基于大语言模型的 AI Agent（目前接入通义千问 Qwen3.5）分析受控情况，结合上下文精准分辨真实漏洞与正常的业务逻辑。
- **📊 优美的漏洞报告**：自动生成基于 HTML 与 Tailwind CSS 驱动的现代数据面板 (`audit-report.html`)，直观地展示风险详情、风险等级和精准的修复建议。
- **🧱 全栈语法分析支持**：完美兼容 Vue 2/3、React、Next.js、Nuxt 环境，以及原生 Node.js 后端代码体系，支持 `.vue`, `.js`, `.jsx`, `.ts`, `.tsx` 等主流拓展名分析检测。
- **🛡️ 增量提交防线拦截**：内置对 Husky 与 lint-staged 的支持，实现基于 Git 暂存区 (Staged) 代码的增量安全审计。一旦发现高危漏洞，将精准阻断 Git 提交，防止风险混入代码库。

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

### 🔑 配置 AI API 凭证
项目根目录下请创建或修改 `.env` 环境变量配置文件，并填入你的阿里云大模型 API 密钥凭证（使用通义千问模型）：

```env
QWEN_API_KEY=your_dashscope_api_key_here
```

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
- **🧠 AI Intelligent False-Positive Filtering**: Sends the suspected points identified in the initial screening, along with the full code context, to an AI Agent (currently powered by Qwen3.5 LLM) to analyze the data control flow. The context ensures accurate differentiation between actual vulnerabilities and normal business logic.
- **📊 Beautiful Vulnerability Reports**: Automatically generates a modern data dashboard (`audit-report.html`) powered by HTML and Tailwind CSS, intuitively displaying risk details, severity levels, and precise mitigation suggestions.
- **🧱 Full-Stack Code Support**: Perfectly compatible with Vue 2/3, React, Next.js, and Nuxt environments, as well as native Node.js backend code structures. It supports mainstream extensions such as `.vue`, `.js`, `.jsx`, `.ts`, and `.tsx`.
- **🛡️ Incremental Commit Defense**: Built-in support for Husky and `lint-staged` allows for incremental security audits based on Git Staged code. If a high-risk vulnerability is discovered, it accurately blocks the Git commit to prevent risks from entering the repository.

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

### 🔑 Authorize AI API Credentials
Create or modify the `.env` configuration file in the project's root directory and fill in your DashScope API key (using the Qwen model):

```env
QWEN_API_KEY=your_dashscope_api_key_here
```

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
