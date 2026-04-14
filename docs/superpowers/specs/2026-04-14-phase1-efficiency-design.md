# Design Spec: Phase 1 - Efficiency & Cost (Caching Strategy)

**Date:** 2026-04-14
**Status:** Approved
**Topic:** Audit caching and multi-model configuration

## Goal
Significantly reduce scan times and API costs by caching previous AI security audit results for unchanged code. Ensure full compatibility with any OpenAI-protocol-compliant LLM API.

## 1. Caching System Architecture
- **Cache File Location**: Project root directory, named `.secscan-cache.json`.
- **Cache Key Generation**: 
  - To ensure we don't return stale results when the user changes analysis rules, the cache key should be a cryptographic hash (e.g., MD5 or SHA-256) of:
    1. The raw file content (or the specific AST sinks content).
    2. The AI `model` name being used.
    3. The `systemPrompt` used for the audit.
- **Cache Value**: The parsed JSON object returned by the AI (`{ riskLevel, reason, suggestion }`).
- **Cache Lifecycle**:
  - The tool will load `.secscan-cache.json` at startup if it exists.
  - Before sending a file to the AI, it checks if the computed hash exists in the cache.
  - If a cache hit occurs, it skips the AI call and uses the cached result.
  - After a successful AI call, it updates the cache in memory.
  - At the end of the scan run, the cache is persisted back to `.secscan-cache.json`.
- **Ignore Rules**: 
  - Add `.secscan-cache.json` to `.gitignore` and `.npmignore` so it isn't tracked by VCS or published to npm.

## 2. Multi-Model Support (OpenAI Protocol)
- Since the OpenAI Node.js SDK already supports custom `baseURL`s, any model that offers an OpenAI-compatible endpoint (like DeepSeek, Ollama, VLLM) is automatically supported.
- **No Hardcoded Presets**: The user just configures `baseURL` and `model` in `ai-sec-scan.config.js`. 
- **Action**: Update the README and `ai-sec-scan.config.example.js` to explicitly state that users can connect to DeepSeek, standard OpenAI, or local Ollama instances just by changing `baseURL`.

## 3. Implementation Plan
1. Create a `lib/cache-manager.js` to handle loading, hashing, saving, and querying.
2. Update `bin/cli.js` to initialize the cache manager, pass it down, and save it on exit.
3. Update `lib/ai-auditor.js` to check the cache before making API requests.
4. Update `.gitignore` and `.npmignore`.
5. Update `ai-sec-scan.config.example.js` and `README.md` to document the OpenAI protocol compatibility.

## 4. Success Criteria
- Running the tool twice on the same unchanged codebase should result in the second run taking milliseconds (cache hit) and zero API consumption.
- Modifying a file will trigger a re-scan just for that file.
- Changing the `model` or `systemPrompt` in the config will invalidate the cache and force a complete re-scan.
