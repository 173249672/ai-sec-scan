/**
 * AI Sec-Scan 示例配置文件
 */

module.exports = {
  ai: {
    // 支持模型: qwen3.5-plus, deepseek-chat, llama3 (ollama) 等
    model: 'qwen3.5-plus',
    baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
    temperature: 0.1,
    
    // 【核心黑科技】自定义系统提示词 (System Prompt)
    // 如果您对 AI 的修复风格不满意，可以在这里进行微调
    systemPrompt: `You are a Tier-1 Security Architect. 
    Analyze the code for OWASP Top 10 vulnerabilities.
    Return JSON with riskLevel, reason, suggestion, and fixCode.
    Fixes must be high-performance and use standard enterprise libraries.`
  },
  
  scanner: {
    // 排除特定目录
    exclude: ['node_modules', 'dist', 'test', 'public'],
    
    // 自定义 AST 匹配规则 (简单规则扩展)
    customRules: [
      { 
        name: 'localStorage', 
        type: 'property', 
        message: 'Info: LocalStorage usage detected. Ensure no sensitive PII is stored.' 
      }
    ]
  }
};
