# 🛡️ AI Sec-Scan

[![npm version](https://img.shields.io/npm/v/ai-sec-scan.svg)](https://www.npmjs.com/package/ai-sec-scan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**AI Sec-Scan** 是一款专为现代全栈开发（Vue, React, Node.js）打造的智能安全扫描工具。它不仅仅是静态分析，更是将 **AST 静态语法树** 与 **大模型 (AI)** 的语义理解深度结合，提供从「发现漏洞」到「自动修复」的完整闭环体验。

[English Version](./README.md)

---

### ✨ 核心特性

- **🧠 AI 智能审计与误报过滤**：基于标准 OpenAI 协议，支持 **通义千问 (Qwen)**、**DeepSeek**、**Ollama** 等模型。AI 会深入理解上下文，精准分辨真实漏洞与正常业务逻辑。
- **🛠️ 交互式自动修复 (--fix)**：**业界领先的修复能力**。工具不仅能发现漏洞，还能生成精准的修复补丁。支持「Git 补丁式」交互确认。
- **⚡ 毫秒级 AI 结果缓存**：内置基于文件内容 Hash 的缓存引擎。未改动的代码将直接跳过 AI 审计，实现瞬时复测，极大地节约 API 成本。
- **🧠 AI 专家模式与自定义 Prompt**：深度掌控 AI 的审计逻辑。可以通过 `init` 向导或配置文件自定义 **System Prompt**，适配您特定的安全合规需求。
- **🧱 全栈语法分析支持**：完美支持 `.vue`, `.js`, `.jsx`, `.ts`, `.tsx`。针对 Vue SFC 区块和 React 复杂 JSX 结构进行了深度优化。
- **📊 自动化导出与集成**：支持生成优美的 HTML 视觉报告以及标准 JSON 数据导出，完美适配 CI/CD 流水线。
- **🛡️ 增量提交防线**：支持 `--staged` 模式，结合 Husky/lint-staged 在 Git 提交阶段拦截高危风险。

---

### 📦 安装指南

```bash
# 作为开发依赖安装 (推荐)
npm install -D ai-sec-scan

# 全局安装
npm install -g ai-sec-scan
```

### ✨ 零配置一键接入 (推荐)
对于新项目，我们提供了一个交互式初始化向导。它能帮您：
1. 自动安装并配置 `husky` 与 `lint-staged` 防线。
2. 交互式选择想用的 AI 模型 (Qwen/DeepSeek/Ollama)。
3. **专家模式**：支持在初始化时自定义 **System Prompt**，定制您的专属安全审计专家。
4. 自动配置安全可靠的 `.env` 密钥存储。

```bash
npx ai-sec-scan init
```

---

### 🚥 使用指南

#### 1. 全量扫描目录
```bash
npx ai-sec-scan ./src
```

#### 2. 精准扫描单文件
```bash
npx ai-sec-scan ./test-lab/vulns.js
```

#### 3. 交互式自动修复 (推荐体验)
扫描并进入「Git Add -P」风格的修复流程：
```bash
npx ai-sec-scan ./src --fix
```

#### 4. 结果导出
```bash
npx ai-sec-scan ./src --json report.json
```

---

### ⚙️ 高级配置

创建 `ai-sec-scan.config.js` 进行深度定制：

```javascript
module.exports = {
  ai: {
    model: 'qwen3.5-plus',      // 模型名称
    temperature: 0.1,           // 采样温度
    // baseURL: '...',          // 自定义模型地址 (如 DeepSeek, Ollama)
  },
  scanner: {
    // 自定义 AST 扫描规则
    customRules: [
      { name: 'localStorage', type: 'property', message: '禁用持久化存储' }
    ]
  }
};
```

---

### 📄 开源协议
[MIT License](./LICENSE)
