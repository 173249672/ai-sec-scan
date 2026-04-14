const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheManager {
  constructor() {
    this.cacheFile = path.join(process.cwd(), '.secscan-cache.json');
    this.cache = this.load();
    this.hasChanges = false;
  }

  load() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        return JSON.parse(data);
      } catch (e) {
        console.warn('⚠️ Cache file corrupted or unreadable. Starting fresh.');
        return {};
      }
    }
    return {};
  }

  generateKey(content, model, systemPrompt) {
    const hash = crypto.createHash('md5');
    hash.update(content || '');
    hash.update(model || '');
    hash.update(systemPrompt || '');
    return hash.digest('hex');
  }

  get(key) {
    return this.cache[key] || null;
  }

  set(key, result) {
    this.cache[key] = result;
    this.hasChanges = true;
  }

  save() {
    if (this.hasChanges) {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf-8');
      this.hasChanges = false; // Reset dirty flag
    }
  }
}

module.exports = { CacheManager };
