# Phase 3: AI Auto-Fixing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated code remediation using AI-generated patches.

**Architecture:** 
1. `lib/ast-scanner.js`: Updated to return start/end character offsets for every sink.
2. `lib/config-loader.js`: Updated the default system prompt to request a JSON field `fixCode`.
3. `bin/cli.js`: Implements the `--fix` flag logic and file writing.

---

### Task 1: Offset Support in AST Scanner

**Files:**
- Modify: `lib/ast-scanner.js`
- Modify: `test/ast-scanner.test.js`

- [ ] **Step 1: Save start/end offsets for each sink**
In `lib/ast-scanner.js`, within `checkJsNode` and `scanFile`:
For every `sinks.push`, add:
```javascript
start: node.start,
end: node.end
```

- [ ] **Step 2: Verification**
Update `test/ast-scanner.test.js` to assert that `start` and `end` are numbers.
Run `node test/ast-scanner.test.js`.

- [ ] **Step 3: Commit**
```bash
git add lib/ast-scanner.js test/ast-scanner.test.js
git commit -m "feat: add start and end offsets to AST sinks"
```

---

### Task 2: AI Prompt Update for Fix Generation

**Files:**
- Modify: `lib/config-loader.js`

- [ ] **Step 1: Update systemPrompt**
Update `DEFAULTS.ai.systemPrompt` to ask for `fixCode`.
```javascript
systemPrompt: `...
{
  "riskLevel": "High" | "Safe",
  "reason": "分析原因",
  "suggestion": "修复建议",
  "fixCode": "如果为 High，请提供修复后的局部代码建议，否则为空字符串"
}`
```

- [ ] **Step 2: Commit**
```bash
git add lib/config-loader.js
git commit -m "feat: update AI prompt to include fixCode"
```

---

### Task 3: Implementation of --fix Flag

**Files:**
- Modify: `bin/cli.js`

- [ ] **Step 1: Add --fix option**
```javascript
program
  .option('--fix', '自动应用针对高危漏洞的 AI 修复建议')
```

- [ ] **Step 2: Implementation of applyFixes function**
Create a helper logic in `cli.js` (or a utility) that:
1. Groups audit details by file.
2. For files with High risk and `fixCode`:
   - Read file.
   - Sort fix items by `start` DESC.
   - Apply edits.
   - Write file.

- [ ] **Step 3: Integrate into action loop**
Call `applyFixes` after the scan is complete and the report is generated.

- [ ] **Step 4: Commit**
```bash
git add bin/cli.js
git commit -m "feat: implement --fix automated remediation"
```

---

### Task 5: Documentation & Testing

- [ ] **Step 1: Update README**
Add "AI Auto-Fixing" to core features and "Usage Guide".

- [ ] **Step 2: Commit**
```bash
git add README.md
git commit -m "docs: document AI auto-fixing feature"
```
