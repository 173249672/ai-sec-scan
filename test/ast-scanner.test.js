const { scanFile } = require('../lib/ast-scanner');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Testing AST Scanner Rules...');

// 1. Test Default Rules (Vue v-html)
const vueFile = path.join(process.cwd(), 'test-vhtml.vue');
fs.writeFileSync(vueFile, `<template><div v-html="rawHtml"></div></template>`);
const vueScan = scanFile(vueFile);
const vHtmlSink = vueScan.sinks.find(s => s.type.includes('v-html'));
assert.ok(vHtmlSink, 'Should detect v-html');
assert.strictEqual(typeof vHtmlSink.start, 'number', 'start should be a number');
assert.strictEqual(typeof vHtmlSink.end, 'number', 'end should be a number');
fs.unlinkSync(vueFile);
console.log('✅ Default rule (v-html) detected with offsets');

// 2. Test Custom Rules
const jsFile = path.join(process.cwd(), 'test-custom.js');
fs.writeFileSync(jsFile, `localStorage.auth = 'password';`);

const config = {
  scanner: {
    customRules: [
      { name: 'auth', type: 'property', message: 'CUSTOM_STORAGE_DETECTED' }
    ]
  }
};

const customScan = scanFile(jsFile, config);
assert.ok(customScan.sinks.some(s => s.type === 'CUSTOM_STORAGE_DETECTED'), 'Should detect custom rule');
fs.unlinkSync(jsFile);
console.log('✅ Custom rule detected');

console.log('✅ AST Scanner tests passed');
