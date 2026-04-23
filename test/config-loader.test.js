const { loadConfig } = require('../lib/config-loader');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Test default values
console.log('Testing default configuration...');
const config = loadConfig();
assert.strictEqual(config.ai.model, 'qwen3.5-plus');
assert.strictEqual(config.ai.temperature, 0.1);
assert.ok(config.ai.systemPrompt.includes('expert security engineer'), 'Default systemPrompt should contain expected text');
console.log('✅ Default config test passed');

// 2. Test user override
console.log('Testing user configuration override...');
const configPath = path.join(process.cwd(), 'sec-scan.test.config.js');
const userConfigContent = `
module.exports = {
  ai: {
    model: 'custom-model',
    temperature: 0.5
  }
};
`;

fs.writeFileSync(configPath, userConfigContent);

// Update loadConfig to support custom paths if necessary? 
// For now the lib only supports sec-scan.config.js
// So the test will rename the file temporarily.

const realConfigPath = path.join(process.cwd(), 'sec-scan.config.js');
const backupExists = fs.existsSync(realConfigPath);
if (backupExists) fs.renameSync(realConfigPath, realConfigPath + '.bak');

fs.renameSync(configPath, realConfigPath);

try {
  const overriddenConfig = loadConfig();
  assert.strictEqual(overriddenConfig.ai.model, 'custom-model');
  assert.strictEqual(overriddenConfig.ai.temperature, 0.5);
} finally {
  fs.unlinkSync(realConfigPath);
  if (backupExists) fs.renameSync(realConfigPath + '.bak', realConfigPath);
}

console.log('✅ User override test passed');
