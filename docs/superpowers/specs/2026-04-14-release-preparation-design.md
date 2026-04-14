# Design Spec: Prepare ai-sec-scan for GitHub and NPM Release

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Project distribution preparation

## Goal
Prepare the existing `universal-sec-scan` project for a professional public release on GitHub and NPM under the name `ai-sec-scan`.

## 1. Package Configuration (package.json)
- Refactor `package.json` with the following changes:
    - `name`: Change from `@Abel/sec-scan` to `ai-sec-scan`.
    - `publishConfig`: Set `"access": "public"`.
    - `license`: Fix syntax error (missing comma after MIT license).
    - `repository`: Add placeholder URL `https://github.com/USER_NAME/ai-sec-scan.git`.
    - `bugs`: Add placeholder URL `https://github.com/USER_NAME/ai-sec-scan/issues`.
    - `homepage`: Add placeholder URL `https://github.com/USER_NAME/ai-sec-scan#readme`.
    - `keywords`: Ensure relevant keywords are present.

## 2. Licensing & Project Hygiene
- **Create LICENSE**: Standard MIT license file naming "Abel" as the author.
- **Update .npmignore**: Ensure standard exclusion patterns:
    ```
    .env
    node_modules
    audit-report.html
    audit-report.json
    test-components/
    .agent/
    .DS_Store
    ```

## 3. CLI & Executability
- Verify `bin/cli.js` contains the proper shebang: `#!/usr/bin/env node`.
- Ensure permissions are set for executability (though NPM handles this via the `bin` field, local testing benefits from it).

## 4. Documentation (README.md)
- Global search and replace: `@Abel/sec-scan` -> `ai-sec-scan`.
- Update all installation snippets (npm, yarn, pnpm).
- Update shields.io badges to use the new name.

## 5. AI Configuration System
- **Config File Support**: Support loading from `sec-scan.config.js` or `.secscanrc` in the project root.
- **Configurable Fields**:
    - `ai.apiKey`: API Key (fallback to `process.env.QWEN_API_KEY`).
    - `ai.baseURL`: API gateway (default: `https://coding.dashscope.aliyuncs.com/v1`).
    - `ai.model`: AI Model name (default: `qwen3.5-plus`).
    - `ai.temperature`: Logic temperature (default: `0.1`).
    - `ai.systemPrompt`: System prompt for analysis. **If missing, use the default internal prompt.**
- **Implementation**: Create `lib/config-loader.js` to manage merged settings.

## 6. Success Criteria
- Valid `package.json` with no syntax errors.
- Correct project name and public access configuration.
- MIT License file present.
- README accurate for new name and installation methods.
- CLI entry point correctly configured.
- AI settings (model, prompt, etc.) are successfully overridden by a local config file if present.
