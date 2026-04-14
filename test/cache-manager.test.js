const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { CacheManager } = require('../lib/cache-manager');

const CACHE_FILE = path.join(process.cwd(), '.secscan-cache.json');

// Cleanup any existing test cache
if (fs.existsSync(CACHE_FILE)) {
  fs.unlinkSync(CACHE_FILE);
}

const cache = new CacheManager();
const content = 'console.log("hello test");';
const model = 'qwen3.5-plus';
const prompt = 'You are a test bot.';
const mockResult = { riskLevel: 'Safe', reason: 'Just a log' };

// 1. Initially it should be empty
const key = cache.generateKey(content, model, prompt);
const miss = cache.get(key);
assert.strictEqual(miss, null, 'Cache should be empty initially');

// 2. Set and Get
cache.set(key, mockResult);
const hit = cache.get(key);
assert.deepStrictEqual(hit, mockResult, 'Should retrieve the exact mock result');

// 3. Save to disk and Reload
cache.save();
assert.ok(fs.existsSync(CACHE_FILE), 'Cache file should be created on save');

const loadedCache = new CacheManager();
const reloadedHit = loadedCache.get(key);
assert.deepStrictEqual(reloadedHit, mockResult, 'Loaded cache should retain items');

// Cleanup
fs.unlinkSync(CACHE_FILE);
console.log('✅ Cache Manager test passed');
