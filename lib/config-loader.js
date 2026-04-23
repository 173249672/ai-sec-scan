const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DEFAULTS = {
  ai: {
    baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
    model: 'qwen3.5-plus',
    temperature: 0.1,
    systemPrompt: `You are an expert security engineer. You will receive code segments for analysis.
    Your task: Identify vulnerabilities and return a JSON object:
    {
      "riskLevel": "High" | "Safe",
      "reason": "Clear explanation of the risk",
      "suggestion": "Professional mitigation advice",
      "fixCode": { "1": "Replacement code snippet" }
    }
    STRICT RULES FOR 'fixCode':
    1. It MUST be a 1:1 replacement for the 'codeSnippet' provided in the task.
    2. If the 'codeSnippet' is part of a JSX attribute (e.g., inside onClick={...}), do NOT include the attribute name or braces. Provide ONLY the inner replacement.
    3. The code must be syntactically valid in its original context.
    4. Use industry-standard security practices (e.g., JSON.parse instead of eval, use sanitization).
    5. No extra text or markdown format.`
  },
  scanner: {
    customRules: []
  },
  includes: [],
  excludes: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/tests/**']
};

function loadConfig() {
  const possiblePaths = [
    path.join(process.cwd(), 'ai-sec-scan.config.js'),
    path.join(process.cwd(), 'sec-scan.config.js')
  ];
  
  let configPath = possiblePaths.find(p => fs.existsSync(p));
  let userConfig = {};
  
  if (configPath) {
    try {
      // Clear cache to allow reloading
      delete require.cache[require.resolve(configPath)];
      userConfig = require(configPath);
    } catch (e) {
      console.warn(`Warning: Failed to load ${path.basename(configPath)} - ` + e.message);
    }
  }

  return {
    ai: {
      ...DEFAULTS.ai,
      ...(userConfig.ai || {}),
      // Priority for API Key: ENV > config file
      apiKey: process.env.QWEN_API_KEY || (userConfig.ai && userConfig.ai.apiKey)
    },
    scanner: {
      ...DEFAULTS.scanner,
      ...(userConfig.scanner || {})
    },
    includes: userConfig.includes || DEFAULTS.includes,
    excludes: userConfig.excludes || DEFAULTS.excludes
  };
}

module.exports = { loadConfig };
