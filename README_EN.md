# 🛡️ AI Sec-Scan

[![npm version](https://img.shields.io/npm/v/ai-sec-scan.svg)](https://www.npmjs.com/package/ai-sec-scan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**AI Sec-Scan** is an intelligent security auditing tool designed for modern full-stack development (Vue, React, Node.js). It combines **AST Static Analysis** with **AI Semantic Understanding** to provide a complete "detection-to-remediation" loop.

[中文版](./README.md)

---

### ✨ Core Features

- **🧠 AI Smart Audit & False Positive Filtering**: Compatible with OpenAI protocol. Supports **Qwen**, **DeepSeek**, **Ollama**, and more. AI understands context to distinguish real vulnerabilities from normal logic.
- **🛠️ Interactive Auto-Fixing (--fix)**: **Industry-leading remediation**. Proposes precise code patches and supports "Git-style" interactive confirmation before applying changes to your source code.
- **⚡ Millisecond-Level AI Caching**: Built-in content-hash caching engine. Unchanged code bypasses AI auditing, ensuring near-instant rescans and significant API cost savings.
- **🧱 Full-Stack Grammar Support**: Deeply optimized for `.vue`, `.js`, `.jsx`, `.ts`, and `.tsx`. Supports both Vue SFC blocks and complex React JSX structures.
- **📊 Automated Reporting & Integration**: Generates beautiful HTML visual reports and standard JSON exports for seamless CI/CD integration.
- **🛡️ Incremental Commits Defense**: Supports `--staged` mode, working with Husky/lint-staged to block high-risk commits at the gates.

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
1. Installs and configures `husky` and `lint-staged` for commit interception.
2. Prompts you to select your preferred AI model (Qwen/DeepSeek/Ollama).
3. Securely manages your API Keys in a `.env` file.

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
