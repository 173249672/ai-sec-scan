<template>
  <div class="admin-panel">
    <h3>System Status</h3>
    <!-- 漏洞 1: Vue 指令中的 XSS -->
    <div v-html="statusMessage"></div>
    <button @click="runDiagnostic">Run Diagnostic</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const statusMessage = ref('<img src=x onerror=alert(1)>');

const runDiagnostic = () => {
  const command = 'echo "Diagnostic running"';
  // 漏洞 2: 使用 eval 执行逻辑
  eval(`console.log("${command}")`);
};
</script>
