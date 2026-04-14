const { loadConfig } = require('../lib/config-loader');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Test default values
console.log('Testing default configuration...');
const config = loadConfig();
assert.strictEqual(config.ai.model, 'qwen3.5-plus');
assert.strictEqual(config.ai.temperature, 0.1);
assert.ok(config.ai.systemPrompt.includes('全栈安全专家'), 'Default systemPrompt should contain expected text');
console.log('✅ Default config test passed');

// 2. Test user override
console.log('Testing user configuration override...');
const configPath = path.join(process.cwd(), 'sec-scan.config.js');
const userConfigContent = `
module.exports = {
  ai: {
    model: 'custom-model',
    temperature: 0.5
  }
};
`;

fs.writeFileSync(configPath, userConfigContent);

// Clear require cache for the config file if it was loaded
delete require.cache[require.resolve(configPath)];

const overriddenConfig = loadConfig();
assert.strictEqual(overriddenConfig.ai.model, 'custom-model');
assert.strictEqual(overriddenConfig.ai.temperature, 0.5);
assert.ok(overriddenConfig.ai.systemPrompt.includes('全栈安全专家'), 'Default systemPrompt should still be available if not overridden');

// Clean up
fs.unlinkSync(configPath);
console.log('✅ User override test passed');
