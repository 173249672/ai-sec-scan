# Design Spec: Phase 4 - Interactive Remediation

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Interactive "Git-Add-P" Style AI Patching

## Goal
Provide users with full control over AI-generated fixes. Instead of blindly overwriting source files, the tool will present each remediation and ask for confirmation before applying it.

## 1. Interaction Logic
- **Flag**: The `--fix` flag now triggers an interactive session unless `--yes` is also provided.
- **Workflow**:
  1. Standard Scan (AST + AI).
  2. Filter `auditDetails` to only include `High` risk with `fixCode`.
  3. For each item, display a "Remediation Card" in the terminal.
  4. Prompt user for action.

## 2. Remediation Card UI
The card will display:
- **Location**: Filename and snippet context.
- **Problem**: The `reason` provided by AI.
- **The Diff**:
  - `[-] Original: ...` (Red)
  - `[+] Proposed: ...` (Green)
- **Options**:
  - `(y) Apply`: Apply this fix to the file.
  - `(n) Skip`: Do not apply this fix.
  - `(a) All`: Apply this and all remaining proposed fixes.
  - `(q) Quit`: Stop the session and exit.

## 3. Technical Implementation
- **Dependency**: Add `inquirer` to handle the interactive prompt loop.
- **Atomic Commits (Best Practice)**: Advise users to commit work before running `--fix`.
- **Applying Changes**: Changes are still applied using the `start`/`end` offsets from Phase 3, ensuring precision.

## 4. Success Criteria
- Running `ai-sec-scan --fix` stops and interacts with the user for every high-risk vulnerability.
- Choosing `n` (Skip) leaves the source file untouched.
- Choosing `y` (Apply) correctly remediates the code at the exact offset.
- The summary at the end accurately reflects how many items were fixed and how many were skipped.
