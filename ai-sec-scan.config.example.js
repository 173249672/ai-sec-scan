/**
 * AI Sec-Scan 配置文件示例
 * 
 * 你可以根据需求在项目根目录创建 ai-sec-scan.config.js 文件
 */

module.exports = {
  ai: {
    /**
     * AI API 密钥 (可选)
     * 默认从环境变量 process.env.QWEN_API_KEY 中读取
     */
    // apiKey: 'your_api_key_here',

    /**
     * API 基础地址
     * 只要兼容 OpenAI 协议的模型均可使用。例如:
     * - 通义千问 (默认): https://coding.dashscope.aliyuncs.com/v1
     * - DeepSeek: https://api.deepseek.com/v1
     * - 本地 Ollama: http://localhost:11434/v1
     */
    // baseURL: 'https://coding.dashscope.aliyuncs.com/v1',

    /**
     * 使用的模型名称
     * 默认: qwen3.5-plus
     */
    model: 'qwen3.5-plus',

    /**
     * 采样温度 (0-2)
     * 较低的值会让输出更稳定，默认: 0.1
     */
    temperature: 0.1,

    /**
     * 自定义系统提示词 (System Prompt)
     * 如果不配置此项，工具将使用内置的安全专家提示词
     */
    // systemPrompt: '你是一个专业的资深代码审计专家...',
  },
  
  scanner: {
    /**
     * 自定义 AST 扫描规则
     * 
     * 支持四种匹配类型:
     * - property: 匹配属性赋值 (如 document.cookie)
     * - call: 匹配函数调用 (如 setTimeout)
     * - jsxAttribute: 匹配 React JSX 属性 (如 dangerouslySetInnerHTML)
     * - vueInstruction: 匹配 Vue 指令 (如 v-html)
     */
    customRules: [
      { 
        name: 'localStorage', 
        type: 'property', 
        message: '禁用的持久化存储 (localStorage)' 
      },
      {
        name: 'setTimeout',
        type: 'call',
        message: '异步代码执行风险 (setTimeout)'
      }
    ]
  }
};
