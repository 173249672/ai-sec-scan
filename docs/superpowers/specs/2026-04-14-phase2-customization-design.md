# Design Spec: Phase 2 - Customization & Integration

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Custom Rule Engine, Optimized Defaults, and JSON Export

## Goal
Improve the scanner's depth by optimizing default security rules and providing a structured engine for user-defined rules. Enable better corporate integration via JSON result exports.

## 1. Optimized Default Rule set
Refactor the internal rule list to cover more real-world attack vectors:
- **Client-Side (Vue/React)**:
  - Add `v-html` (Vue instruction).
  - Add `outerHTML`.
  - Add `src` (context-dependent XSS).
- **Server-Side (Node.js)**:
  - Add `spawn`, `fork`, `execFile` (Child process commands).
  - Add `new Function()` (Dynamic execution).
  - Add `writeFile`, `appendFile`, `unlink` (File manipulation).
  - Add `execute`, `run` (Generic DB/Shell patterns).

## 2. Custom Rule Engine
Users can define rules in `ai-sec-scan.config.js` under the `scanner.customRules` key.
- **Rule Structure**:
  ```javascript
  {
    name: "pattern",    // property name or function name
    type: "property" | "call" | "jsxAttribute" | "vueInstruction",
    message: "Custom warning message"
  }
  ```
- **Merging**: Custom rules will be merged with the optimized default set at runtime.

## 3. JSON Export System
Support a new CLI flag `--json <filename>` to output a machine-readable summary of the scan results.
- **Output Schema**:
  ```json
  {
    "scanTime": "timestamp",
    "summary": {
      "totalScanned": 0,
      "suspiciousDetected": 0,
      "aiConfirmedHigh": 0,
      "aiCachedHits": 0
    },
    "details": [
      {
        "file": "path/to/file.js",
        "riskLevel": "High",
        "reason": "AI reasoning",
        "suggestion": "How to fix"
      }
    ]
  }
  ```

## 4. Success Criteria
- Users can intercept custom API calls (e.g., `localStorage.setItem`) via configuration.
- Vue files with `v-html` are successfully caught by the AST scanner.
- Running with `--json report.json` produces a valid JSON file with all audit details.
