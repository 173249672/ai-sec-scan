# Phase 1: Efficiency & Cost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a caching system to reduce API consumption and improve speed, and document multi-model compatibility via standard OpenAI protocol.

**Architecture:** 
1. `lib/cache-manager.js`: Handles loading `.secscan-cache.json`, generating MD5 hashes from content/model/prompt, and saving the cache.
2. `lib/ai-auditor.js`: Updated to check the cache before hitting the API, and populate the cache on completion.
3. `bin/cli.js`: Orchestrates the saving of the cache at the end of the run.
4. `.gitignore` & `.npmignore`: Exclude cache files.
5. README & Config Docs: Add explicit examples detailing how to connect to generic OpenAI-compatible APIs (like locally hosted models or DeepSeek).

**Tech Stack:** Node.js (crypto, fs, path).

---

### Task 1: Create Cache Manager

**Files:**
- Create: `lib/cache-manager.js`
- Create: `test/cache-manager.test.js`

- [ ] **Step 1: Write test for Cache Manager**
```javascript
// test/cache-manager.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { CacheManager } = require('../lib/cache-manager');

const CACHE_FILE = path.join(process.cwd(), '.secscan-cache.json');

// Cleanup any existing test cache
if (fs.existsSync(CACHE_FILE)) {
  fs.unlinkSync(CACHE_FILE);
}

const cache = new CacheManager();
const content = 'console.log("hello test");';
const model = 'qwen3.5-plus';
const prompt = 'You are a test bot.';
const mockResult = { riskLevel: 'Safe', reason: 'Just a log' };

// 1. Initially it should be empty
const key = cache.generateKey(content, model, prompt);
const miss = cache.get(key);
assert.strictEqual(miss, null, 'Cache should be empty initially');

// 2. Set and Get
cache.set(key, mockResult);
const hit = cache.get(key);
assert.deepStrictEqual(hit, mockResult, 'Should retrieve the exact mock result');

// 3. Save to disk and Reload
cache.save();
assert.ok(fs.existsSync(CACHE_FILE), 'Cache file should be created on save');

const loadedCache = new CacheManager();
const reloadedHit = loadedCache.get(key);
assert.deepStrictEqual(reloadedHit, mockResult, 'Loaded cache should retain items');

// Cleanup
fs.unlinkSync(CACHE_FILE);
console.log('✅ Cache Manager test passed');
```

- [ ] **Step 2: Implement lib/cache-manager.js**
```javascript
// lib/cache-manager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheManager {
  constructor() {
    this.cacheFile = path.join(process.cwd(), '.secscan-cache.json');
    this.cache = this.load();
    this.hasChanges = false;
  }

  load() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        return JSON.parse(data);
      } catch (e) {
        console.warn('⚠️ Cache file corrupted or unreadable. Starting fresh.');
        return {};
      }
    }
    return {};
  }

  generateKey(content, model, systemPrompt) {
    const hash = crypto.createHash('md5');
    hash.update(content);
    hash.update(model);
    hash.update(systemPrompt);
    return hash.digest('hex');
  }

  get(key) {
    return this.cache[key] || null;
  }

  set(key, result) {
    this.cache[key] = result;
    this.hasChanges = true;
  }

  save() {
    if (this.hasChanges) {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf-8');
      this.hasChanges = false; // Reset dirty flag
    }
  }
}

module.exports = { CacheManager };
```

- [ ] **Step 3: Run the test**
Run: `node test/cache-manager.test.js`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add lib/cache-manager.js test/cache-manager.test.js
git commit -m "feat: implement file-based caching manager"
```

---

### Task 2: Integrate Cache into Auditor & CLI

**Files:**
- Modify: `lib/ai-auditor.js`
- Modify: `bin/cli.js`

- [ ] **Step 1: Update ai-auditor.js to use cache**
Update `lib/ai-auditor.js` to accept cache manager as argument and use it:
```javascript
// lib/ai-auditor.js
const { OpenAI } = require('openai');
const { loadConfig } = require('./config-loader');

async function analyzeWithQwen(fileName, scanResult, cacheManager) {
  const { sinks, content, ext } = scanResult;
  const config = loadConfig();

  const client = new OpenAI({
    apiKey: config.ai.apiKey,
    baseURL: config.ai.baseURL,
  });

  const sinkDescriptions = sinks.map((s, i) =>
    `疑点 ${i + 1}: [${s.type}]\n代码: ${s.codeSnippet}`
  ).join('\n\n');

  const fullPromptContent = `文件: ${fileName}\n\n【风险点】\n${sinkDescriptions}\n\n【源码详情】\n${content}`;

  let cacheKey = null;
  if (cacheManager) {
    // We hash the prompt content, model, and system prompt.
    cacheKey = cacheManager.generateKey(fullPromptContent, config.ai.model, config.ai.systemPrompt);
    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      return { ...cachedResult, _cached: true };
    }
  }

  const response = await client.chat.completions.create({
    model: config.ai.model,
    messages: [
      { role: 'system', content: config.ai.systemPrompt },
      { role: 'user', content: fullPromptContent }
    ],
    response_format: { type: "json_object" },
    temperature: config.ai.temperature,
  });

  const aiResult = JSON.parse(response.choices[0].message.content);

  // Store in cache for future runs
  if (cacheManager && cacheKey) {
    cacheManager.set(cacheKey, aiResult);
  }

  return aiResult;
}

module.exports = { analyzeWithQwen };

```

- [ ] **Step 2: Update bin/cli.js to manage cache lifecycle**
Modify `bin/cli.js` to instance `CacheManager`, pass it to `analyzeWithQwen`, check if any were cached for summary, and run `.save()` at the end.
Replace the imports at the top and the analysis loop:
1. Add `const { CacheManager } = require('../lib/cache-manager');` near the top.
2. Under `const limit = pLimit(3);`, add `const cacheManager = new CacheManager();` and a summary counter `aiCachedHits: 0`.
3. In the analysis task generation map, pass `cacheManager`. Change `analyzeWithQwen(item.file, item)` to `analyzeWithQwen(item.file, item, cacheManager)`.
4. If `report._cached` is true, increment `aiCachedHits`. Also use appropriate icons. Wait, just increment `summary.aiCachedHits++`.
5. Before `generateHtmlReport()`, run `cacheManager.save()`.

Wait, to be exact on Step 2 modify `bin/cli.js`:
Just provide instructions to modify the file via string replacement in CLI context.

```bash
# This is an intent descriptor for the agent. 
# You should use multi_replace_file_content for bin/cli.js
```
The exact edits for `bin/cli.js`:
Insert import:
`const { CacheManager } = require('../lib/cache-manager');`

Update the summary object:
```javascript
    const summary = {
      totalScanned: files.length,
      suspiciousDetected: suspiciousFiles.length,
      aiCachedHits: 0,
      aiConfirmedHigh: 0,
      aiConfirmedSafe: 0,
      failedRequests: 0
    };
    const cacheManager = new CacheManager();
```

Inside the `.map`:
```javascript
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
```

Before report generation:
```javascript
    await Promise.all(tasks);
    
    cacheManager.save(); // Save cache back to disk

    // --- 4. 生成报告 ---
```
Update the summary console log section in `bin/cli.js` to show cache hits:
```javascript
    console.log(`⏱️  总耗时:     ${duration}s`);
    console.log(`📂 扫描文件:   ${summary.totalScanned}`);
    console.log(`🔍 AST 嫌疑点: ${summary.suspiciousDetected}`);
    console.log(`⚡ API 缓存命中: ${summary.aiCachedHits}`);
    console.log(chalk.red(`🚨 AI 确认高危: ${summary.aiConfirmedHigh}`));
```


- [ ] **Step 3: Commit**
```bash
git add lib/ai-auditor.js bin/cli.js
git commit -m "feat: integrate AST scan caching"
```

---

### Task 3: Ignore Files and Update Documentation

**Files:**
- Modify: `.gitignore`
- Modify: `.npmignore`
- Modify: `ai-sec-scan.config.example.js`
- Modify: `README.md`

- [ ] **Step 1: Exclude cache file**
Add `.secscan-cache.json` to both `.gitignore` and `.npmignore`.

- [ ] **Step 2: Update Config Example**
Highlight how to connect to Local LLMs or DeepSeek.
Modify `ai-sec-scan.config.example.js` to change the `baseURL` documentation:
```javascript
    /**
     * API 基础地址
     * 只要兼容 OpenAI 协议的模型均可使用。例如:
     * - 通义千问 (默认): https://coding.dashscope.aliyuncs.com/v1
     * - DeepSeek: https://api.deepseek.com/v1
     * - 本地 Ollama: http://localhost:11434/v1
     */
    // baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
```

- [ ] **Step 3: Update README**
Mention caching in core features.
Mention multi-model OpenAI support properly.

- [ ] **Step 4: Commit**
```bash
git add .gitignore .npmignore ai-sec-scan.config.example.js README.md
git commit -m "docs: explain cache logic and document multi-model usage"
```

---

### Task 4: Package.json Test script addition

- [ ] **Step 1: Ensure all tests run**
Update `package.json` test script:
```json
    "test": "node test/config-loader.test.js && node test/cache-manager.test.js"
```

- [ ] **Step 2: Commit**
```bash
git add package.json
git commit -m "test: add cache manager test to suite"
```
