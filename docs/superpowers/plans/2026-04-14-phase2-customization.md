# Phase 2: Customization & Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a customizable rule engine, expand default scanner rules, and support JSON result export.

**Architecture:** 
1. `lib/ast-scanner.js`: Refactored to use a centralized rule-matching engine that merges defaults with config-provided rules.
2. `lib/config-loader.js`: Updated to include logic for parsing and normalizing `scanner.customRules`.
3. `bin/cli.js`: Updated to handle the `--json` flag and output the audit results.

**Tech Stack:** Node.js.

---

### Task 1: Refactor AST Scanner & Expand Rules

**Files:**
- Modify: `lib/ast-scanner.js`
- Create: `test/ast-scanner.test.js`

- [ ] **Step 1: Expand rules in checkJsNode**
Update `lib/ast-scanner.js` to support more default sinks:
- Assignment: `innerHTML`, `outerHTML`, `href`, `dangerouslySetInnerHTML`.
- Calls: `exec`, `eval`, `spawn`, `fork`, `execFile`, `new Function`, `query`, `execute`, `run`.
- Add context for `JSXAttribute` and `Vue` (if needed).

- [ ] **Step 2: Implement dynamic Rule Engine logic**
Update `scanFile` and `checkJsNode` to accept `userRules`.
```javascript
// In checkJsNode, iterate through rules instead of hardcoded lists.
```

- [ ] **Step 3: Add Vue v-html support**
Update the `@vue/compiler-sfc` part of `scanFile` to look for `v-html` attributes in the template section.

- [ ] **Step 4: Verify with tests**
Create `test/ast-scanner.test.js` and run `node test/ast-scanner.test.js`.

- [ ] **Step 5: Commit**
```bash
git add lib/ast-scanner.js test/ast-scanner.test.js
git commit -m "feat: expand default rules and implement dynamic rule engine"
```

---

### Task 2: Config Loader Update

**Files:**
- Modify: `lib/config-loader.js`

- [ ] **Step 1: Add scanner defaults to config-loader**
```javascript
const DEFAULTS = {
  // ... ai config
  scanner: {
    customRules: []
  }
};
```

- [ ] **Step 2: Commit**
```bash
git add lib/config-loader.js
git commit -m "feat: add scanner custom rules to config loader"
```

---

### Task 3: JSON Export Implementation

**Files:**
- Modify: `bin/cli.js`

- [ ] **Step 1: Add --json option to commander**
```javascript
program
  .option('--json <path>', '导出扫描结果到 JSON 文件')
```

- [ ] **Step 2: Logic to write JSON file**
In the `.action` block, if `options.json` is present, `fs.writeFileSync(options.json, JSON.stringify(reportData, null, 2))`.

- [ ] **Step 3: Commit**
```bash
git add bin/cli.js
git commit -m "feat: add JSON export support"
```

---

### Task 4: Documentation & Final Testing

**Files:**
- Modify: `README.md`
- Modify: `ai-sec-scan.config.example.js`
- Modify: `package.json` (add all tests to script)

- [ ] **Step 1: Update README and Example Config**
Document the new rules and how to add custom ones.

- [ ] **Step 2: Commit and Cleanup**
```bash
git add .
git commit -m "docs: document rule engine and json export"
```
