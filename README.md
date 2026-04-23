# 🛡️ AI Sec-Scan

[![npm version](https://img.shields.io/npm/v/ai-sec-scan.svg)](https://www.npmjs.com/package/ai-sec-scan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**AI Sec-Scan** is an intelligent security auditing tool designed for modern full-stack development (Vue, React, Node.js). It combines **AST Static Analysis** with **AI Semantic Understanding** to provide a complete "detection-to-remediation" loop.

[中文版](./README.zh-CN.md)

---

### ✨ Core Features

- **🧠 AI Smart Audit & False Positive Filtering**: Compatible with OpenAI protocol. Supports **Qwen**, **DeepSeek**, **Ollama**, and more. AI understands context to distinguish real vulnerabilities from normal logic.
- **⚡ Tree-sitter Powered Static Engine**: High-performance AST analysis (JS, TS, Vue, JSX, TSX). Supports **Declarative Security Rules** via `.scm` queries for extreme speed and precision.
- **📊 Premium Visual Reports**: Stunning dark-mode professional HTML reports with glassmorphism design, featuring:
  - **Global I18n Support**: One-click toggle between **English** and **Chinese**.
  - **Interactive Modal**: Elegant details popup for deep-dive into AI remediation suggestions.
  - **Vulnerability Lifecycle**: Interactive "Lock" (to confirm) and "Ignore" (to archive) workflows.
- **🛠️ Interactive Auto-Fixing (--fix)**: **Industry-leading remediation**. Proposes precise code patches and supports "Git-style" interactive confirmation.
- **🔄 Legacy Support**: Full backward compatibility for `customRules` in `ai-sec-scan.config.js`.
- **⚡ Millisecond-Level AI Caching**: Built-in content-hash caching engine. Unchanged code bypasses AI auditing, saving significant API costs.
- **🧠 AI Expert Mode & Custom Prompts**: Full control over the AI's behavior via `init` wizard or config file.
- **🛡️ Incremental Commits Defense**: Supports `--staged` mode with Husky/lint-staged to block high-risk commits.

---

### 📦 Installation

```bash
# Recommended: Install as devDependency
npm install -D ai-sec-scan

# Global installation
npm install -g ai-sec-scan
```

### ✨ Zero-Config Initialization (Recommended)
For new integrations, we provide an interactive setup wizard that automatically:
1. Installs and configures `husky` and `lint-staged`.
2. Prompts you to select your preferred AI model (Qwen/DeepSeek/Ollama).
3. **Expert Mode**: Allows customizing the **System Prompt** for bespoke security rules.
4. Securely manages your API Keys in a `.env` file.

```bash
npx ai-sec-scan init
```

---

### 🚥 Usage Guide

#### 1. Full Directory Scan
```bash
npx ai-sec-scan ./src
```

#### 2. Single File Scan
```bash
npx ai-sec-scan ./test-lab/vulns.js
```

#### 3. Interactive Remediation
Enter the "Git Add -P" style fix workflow:
```bash
npx ai-sec-scan ./src --fix
```

#### 4. Exporting Results
```bash
npx ai-sec-scan ./src --json report.json
```

---

### ⚙️ Advanced Configuration

Create `ai-sec-scan.config.js` for deeper customization:

```javascript
module.exports = {
  ai: {
    model: 'qwen3.5-plus',      // Model name
    temperature: 0.1,           // Logic temperature
    // baseURL: '...',          // Custom API endpoint (e.g., DeepSeek, Ollama)
  },
  scanner: {
    // Custom AST scanning rules
    customRules: [
      { name: 'localStorage', type: 'property', message: 'Disabled Persistent Storage' }
    ]
  }
};
```

---

### 📄 License
[MIT License](./LICENSE)
