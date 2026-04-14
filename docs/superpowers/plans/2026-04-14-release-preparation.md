# Release Preparation - ai-sec-scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare `universal-sec-scan` for public release as `ai-sec-scan` with a new configuration system.

**Architecture:** 
1. Update project metadata and identity.
2. Implement a `config-loader.js` that merges hardcoded defaults with optional `sec-scan.config.js` or `.env` variables.
3. Refactor the AI auditor to use the dynamic configuration.

**Tech Stack:** Node.js, Babel (parser), OpenAI SDK, standard Node modules.

---

### Task 1: Project Metadata & Identity Cleanup

**Files:**
- Modify: `package.json`
- Create: `LICENSE`
- Modify: `.npmignore`

- [ ] **Step 1: Update package.json name, access, and fix syntax**
Modify `package.json`: 
- `name` -> `ai-sec-scan`
- `publishConfig.access` -> `public`
- Fix missing comma after `"license": "MIT"`
- Add `repository`, `bugs`, `homepage` placeholders.

- [ ] **Step 2: Create MIT LICENSE**
Create `LICENSE` file with standard MIT text (Author: Abel).

- [ ] **Step 3: Update .npmignore**
Exclude dev-only artifacts: `.env`, `audit-report.*`, `test-components/`, `.agent/`.

- [ ] **Step 4: Commit**
```bash
git add package.json LICENSE .npmignore
git commit -m "chore: update project identity and add license"
```

---

### Task 2: Documentation & CLI Check

**Files:**
- Modify: `README.md`
- Modify: `bin/cli.js`

- [ ] **Step 1: Global rename in README**
Replace all `@Abel/sec-scan` with `ai-sec-scan` and update installation commands.

- [ ] **Step 2: Verify CLI shebang**
Ensure `bin/cli.js` starts with `#!/usr/bin/env node`.

- [ ] **Step 3: Commit**
```bash
git add README.md bin/cli.js
git commit -m "docs: rename project to ai-sec-scan and verify CLI"
```

---

### Task 3: Configuration System (Config Loader)

**Files:**
- Create: `lib/config-loader.js`
- Create: `test/config-loader.test.js`

- [ ] **Step 1: Write a test for config loading**
Create `test/config-loader.test.js` to verify merging of defaults and local config.

```javascript
const { loadConfig } = require('../lib/config-loader');
const assert = require('assert');

// Test default values
const config = loadConfig();
assert.strictEqual(config.ai.model, 'qwen3.5-plus');
assert.strictEqual(config.ai.temperature, 0.1);
console.log('Default config test passed');
```

- [ ] **Step 2: Implement lib/config-loader.js**
```javascript
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DEFAULTS = {
  ai: {
    baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
    model: 'qwen3.5-plus',
    temperature: 0.1,
    systemPrompt: `你是一个全栈安全专家。你会收到代码文件内容。
你的任务是判断代码是否存在安全漏洞。
必须返回 JSON 格式：
{
  "riskLevel": "High" | "Safe",
  "reason": "分析原因",
  "suggestion": "修复建议"
}`
  }
};

function loadConfig() {
  const configPath = path.join(process.cwd(), 'sec-scan.config.js');
  let userConfig = {};
  
  if (fs.existsSync(configPath)) {
    try {
      userConfig = require(configPath);
    } catch (e) {
      console.warn('Warning: Failed to load sec-scan.config.js');
    }
  }

  return {
    ai: {
      ...DEFAULTS.ai,
      ...(userConfig.ai || {}),
      apiKey: process.env.QWEN_API_KEY || (userConfig.ai && userConfig.ai.apiKey)
    }
  };
}

module.exports = { loadConfig };
```

- [ ] **Step 3: Run the test**
Run: `node test/config-loader.test.js`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add lib/config-loader.js test/config-loader.test.js
git commit -m "feat: add configuration loader"
```

---

### Task 4: Integrate Config into AI Auditor

**Files:**
- Modify: `lib/ai-auditor.js`

- [ ] **Step 1: Use config-loader in ai-auditor.js**
Refactor `analyzeWithQwen` to use values from `loadConfig()`.

```javascript
const { OpenAI } = require('openai');
const { loadConfig } = require('./config-loader');

const config = loadConfig();
const client = new OpenAI({
  apiKey: config.ai.apiKey,
  baseURL: config.ai.baseURL,
});

async function analyzeWithQwen(fileName, scanResult) {
  const { sinks, content, ext } = scanResult;
  const config = loadConfig(); // Reload to allow fresh config per run if needed

  const sinkDescriptions = sinks.map((s, i) =>
    `疑点 ${i + 1}: [${s.type}]\n代码: ${s.codeSnippet}`
  ).join('\n\n');

  const response = await client.chat.completions.create({
    model: config.ai.model,
    messages: [
      { role: 'system', content: config.ai.systemPrompt },
      { role: 'user', content: `文件: ${fileName}\n\n【风险点】\n${sinkDescriptions}\n\n【源码详情】\n${content}` }
    ],
    response_format: { type: "json_object" },
    temperature: config.ai.temperature,
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { analyzeWithQwen };
```

- [ ] **Step 2: Commit**
```bash
git add lib/ai-auditor.js
git commit -m "feat: refactor ai-auditor to use dynamic configuration"
```

---

### Task 5: Final Check & Local Test

- [ ] **Step 1: Create a temporary test config**
Create a `sec-scan.config.js` and verify it's picked up.

- [ ] **Step 2: Run a dry-run scan (if possible)**
```bash
node bin/cli.js ./lib --dry-run
```

- [ ] **Step 3: Commit and Cleanup**
Remove any temporary test configs and commit final state.
