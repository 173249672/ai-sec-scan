const { OpenAI } = require('openai');
const { loadConfig } = require('./config-loader');

async function analyzeWithQwen(fileName, scanResult, cacheManager) {
  const { sinks, content, ext } = scanResult;
  // Load configuration (merges defaults, .env, and sec-scan.config.js)
  const config = loadConfig();

  const client = new OpenAI({
    apiKey: config.ai.apiKey,
    baseURL: config.ai.baseURL,
  });

  const sinkDescriptions = sinks.map((s, i) =>
    `疑点 ${i + 1}: [${s.type}]\n代码: ${s.codeSnippet}`
  ).join('\n\n');

  const fullPromptContent = `文件: ${fileName}\n\n【风险点】\n${sinkDescriptions}\n\n【源码详情】\n${content}`;

  let cacheKey = null;
  if (cacheManager) {
    cacheKey = cacheManager.generateKey(fullPromptContent, config.ai.model, config.ai.systemPrompt);
    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      return { ...cachedResult, _cached: true };
    }
  }

  const response = await client.chat.completions.create({
    model: config.ai.model,
    messages: [
      { role: 'system', content: config.ai.systemPrompt },
      { role: 'user', content: fullPromptContent }
    ],
    response_format: { type: "json_object" },
    temperature: config.ai.temperature,
  });

  const aiResult = JSON.parse(response.choices[0].message.content);

  // Store in cache for future runs
  if (cacheManager && cacheKey) {
    cacheManager.set(cacheKey, aiResult);
  }

  return aiResult;
}

module.exports = { analyzeWithQwen };
