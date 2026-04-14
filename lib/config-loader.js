const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DEFAULTS = {
  ai: {
    baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
    model: 'qwen3.5-plus',
    temperature: 0.1,
    systemPrompt: `你是一个全栈安全专家。你会收到代码文件内容。
你的任务是判断代码是否存在安全漏洞。
必须返回 JSON 格式：
{
  "riskLevel": "High" | "Safe",
  "reason": "分析原因",
  "suggestion": "修复建议"
}`
  }
};

function loadConfig() {
  const configPath = path.join(process.cwd(), 'sec-scan.config.js');
  let userConfig = {};
  
  if (fs.existsSync(configPath)) {
    try {
      // Clear cache to allow reloading during the same process if needed (mostly for tests)
      delete require.cache[require.resolve(configPath)];
      userConfig = require(configPath);
    } catch (e) {
      console.warn('Warning: Failed to load sec-scan.config.js - ' + e.message);
    }
  }

  return {
    ai: {
      ...DEFAULTS.ai,
      ...(userConfig.ai || {}),
      // Priority for API Key: ENV > config file
      apiKey: process.env.QWEN_API_KEY || (userConfig.ai && userConfig.ai.apiKey)
    }
  };
}

module.exports = { loadConfig };
