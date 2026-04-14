const { scanFile } = require('../lib/ast-scanner');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Testing AST Scanner Rules...');

// 1. Test Default Rules (Vue v-html)
const vueFile = path.join(process.cwd(), 'test-vhtml.vue');
fs.writeFileSync(vueFile, `<template><div v-html="rawHtml"></div></template>`);
const vueScan = scanFile(vueFile);
assert.ok(vueScan.sinks.some(s => s.type.includes('v-html')), 'Should detect v-html');
fs.unlinkSync(vueFile);
console.log('✅ Default rule (v-html) detected');

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
