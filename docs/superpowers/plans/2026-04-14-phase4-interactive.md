# Phase 4: Interactive Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an interactive terminal UI for applying AI fixes.

**Architecture:** 
1. `bin/cli.js`: Integration of `inquirer` and refactoring of `applyFixes` into an interactive loop.
2. `package.json`: Addition of `inquirer` dependency.

---

### Task 1: Environment & Dependency Setup

- [ ] **Step 1: Install inquirer**
Run: `npm install inquirer@^8.0.0` (using v8 for CommonJS compatibility since we are not using ESM yet).

- [ ] **Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add inquirer dependency for interactive UI"
```

---

### Task 2: Implement Interactive Fix Loop

**Files:**
- Modify: `bin/cli.js`

- [ ] **Step 1: Refactor applyFixes to be interactive**
Update `applyFixes` in `bin/cli.js` to use `inquirer`.
It should iterate through files and their sinks, displaying the diff and prompting for choice.

- [ ] **Step 2: Add --yes flag to skip interaction**
```javascript
program
  .option('--fix', '自动应用针对高危漏洞的 AI 修复建议')
  .option('--yes', '直接应用所有修复，不进行交互式确认')
```

- [ ] **Step 3: Support "Apply All" in the middle of the loop**
Track a `skipRemainingInteraction` boolean.

- [ ] **Step 4: Commit**
```bash
git add bin/cli.js
git commit -m "feat: implement interactive remediation workflow"
```

---

### Task 3: Polishing & Final Documentation

- [ ] **Step 1: Update README**
Add "Interactive Mode" to the `--fix` documentation.

- [ ] **Step 2: Final cleanup**
Run all tests to ensure no regressions.

- [ ] **Step 3: Commit and Finish**
```bash
git add .
git commit -m "docs: finalize phase 4 documentation"
```
