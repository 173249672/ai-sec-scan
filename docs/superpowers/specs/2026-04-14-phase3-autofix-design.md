# Design Spec: Phase 3 - AI Auto-Fixing

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Automated Security Remediation via AI

## Goal
Close the loop from detection to remediation. Allow the tool to not only identify security vulnerabilities but also propose and apply local code fixes using the `--fix` flag.

## 1. Engine Enhancements
- **AST Scanner**: Modify `lib/ast-scanner.js` to include `start` and `end` character offsets for every detected sink. This allows for precise surgical replacement of code strings.
- **AI Prompt**: Update the global `systemPrompt` in `config-loader.js` to include a new field in the JSON response:
  - `fixCode`: A string containing the recommended safe version of the `codeSnippet`.
  - Example instruction: "If riskLevel is High, provide a `fixCode` that remediates the issue (e.g., using textContent instead of innerHTML)."

## 2. CLI Remediation Workflow (`--fix`)
When the user runs `ai-sec-scan --fix [dir]`:
1. **Full Scan**: Perform a standard scan. AI will provide analysis results + `fixCode` for detected high-risk items.
2. **Remediation Logic**:
   - For each file containing `High` risk vulnerabilities:
     - Group vulnerabilities by file.
     - Sort vulnerabilities by their `start` offset in **descending order** (bottom-to-top). This ensures that modifying code at the end of the file doesn't invalidate the offsets for vulnerabilities located earlier in the file.
     - Perform string replacement: `content = content.slice(0, start) + fixCode + content.slice(end)`.
     - Write the modified content back to the file.
3. **User Notification**: Print a summary of how many files were automatically fixed.

## 3. Data Schema Updates
The audit report result for a single file will now look like:
```json
{
  "riskLevel": "High",
  "reason": "...",
  "suggestion": "...",
  "fixCode": "...", // NEW
  "sinks": [
    { "type": "...", "codeSnippet": "...", "start": 100, "end": 150 } // OFFSET SUPPORT
  ]
}
```

## 4. Success Criteria
- Running `ai-sec-scan --fix` on a file containing `el.innerHTML = userInput` automatically changes it to something safe (e.g., `el.textContent = userInput`) as suggested by the AI.
- Concurrent fixes in the same file do not corrupt the file structure.
- The cache correctly stores `fixCode` so that subsequent `--fix` runs (if needed) are instantaneous.
