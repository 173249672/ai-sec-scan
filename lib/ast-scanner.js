const fs = require('fs');
const path = require('path');
const { parse: vueParse, compileTemplate } = require('@vue/compiler-sfc');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// 默认的高危规则库
const DEFAULT_RULES = [
  // 属性赋值类
  { name: 'innerHTML', type: 'property', message: 'JS 危险操作 (innerHTML)' },
  { name: 'outerHTML', type: 'property', message: 'JS 危险操作 (outerHTML)' },
  { name: 'href', type: 'property', message: '敏感属性赋值 (href)' },
  { name: 'src', type: 'property', message: '敏感属性赋值 (src)' },
  { name: 'dangerouslySetInnerHTML', type: 'property', message: 'React 风险属性 (dangerouslySetInnerHTML)' },

  // 函数调用类
  { name: 'eval', type: 'call', message: '动态代码执行 (eval)' },
  { name: 'exec', type: 'call', message: '服务端命令注入 (exec)' },
  { name: 'spawn', type: 'call', message: '服务端命令注入 (spawn)' },
  { name: 'fork', type: 'call', message: '服务端进程创建 (fork)' },
  { name: 'execFile', type: 'call', message: '服务端核心调用 (execFile)' },
  { name: 'query', type: 'call', message: '数据库/敏感查询 (query)' },
  { name: 'execute', type: 'call', message: '数据库/敏感执行 (execute)' },
  { name: 'run', type: 'call', message: '服务端敏感执行 (run)' },
  { name: 'readFile', type: 'call', message: '文件系统读取 (readFile)' },
  { name: 'readFileSync', type: 'call', message: '同步文件读取 (readFileSync)' },
  { name: 'writeFile', type: 'call', message: '文件系统写入 (writeFile)' },
  { name: 'unlink', type: 'call', message: '文件系统删除 (unlink)' },
  { name: 'Function', type: 'call', message: '动态函数创建 (new Function)' },

  // Vue 指令类
  { name: 'v-html', type: 'vueInstruction', message: 'Vue 风险指令 (v-html)' }
];

function checkJsNode(path, scriptContent, sinks, activeRules) {
  const node = path.node;

  // 1. 处理 AssignmentExpression (属性赋值)
  if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
    const propName = node.left.property.name || node.left.property.value;
    const rule = activeRules.find(r => r.type === 'property' && r.name === propName);
    if (rule) {
      // 向上寻找最近的语句节点或变量声明，以便替换整行
      let targetNode = node;
      if (typeof path !== 'undefined' && path.parentPath) {
        if (path.parentPath.isExpressionStatement()) {
          targetNode = path.parentPath.node;
        } else if (path.parentPath.isVariableDeclarator()) {
          // 如果在 const a = eval() 中，捕获整个变量声明（暂不包含 const，只包含 a = ...）
          // 或者我们可以捕获更上层的 VariableDeclaration
          if (path.parentPath.parentPath && path.parentPath.parentPath.isVariableDeclaration()) {
            targetNode = path.parentPath.parentPath.node;
          }
        }
      }

      sinks.push({
        type: rule.message,
        bindingExpression: scriptContent.substring(node.right.start, node.right.end),
        codeSnippet: scriptContent.substring(targetNode.start, targetNode.end),
        start: targetNode.start,
        end: targetNode.end
      });
    }
  }

  // 2. 处理 CallExpression (函数调用)
  if (node.type === 'CallExpression') {
    const callee = node.callee;
    let calleeName = '';
    
    if (callee.type === 'Identifier') {
      calleeName = callee.name;
    } else if (callee.type === 'MemberExpression') {
      calleeName = callee.property.name || callee.property.value;
    }

    const rule = activeRules.find(r => r.type === 'call' && r.name === calleeName);
    if (rule) {
      let targetNode = node;
      if (typeof path !== 'undefined' && path.parentPath) {
        if (path.parentPath.isExpressionStatement()) {
          targetNode = path.parentPath.node;
        } else if (path.parentPath.isVariableDeclarator()) {
          if (path.parentPath.parentPath && path.parentPath.parentPath.isVariableDeclaration()) {
            targetNode = path.parentPath.parentPath.node;
          }
        }
      }

      sinks.push({
        type: rule.message,
        bindingExpression: '函数参数',
        codeSnippet: scriptContent.substring(targetNode.start, targetNode.end),
        start: targetNode.start,
        end: targetNode.end
      });
    }
  }
}

function scanFile(filePath, userConfig = {}) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const sinks = [];

  // 合并用户自定义规则
  const customRules = (userConfig.scanner && userConfig.scanner.customRules) || [];
  const activeRules = [...DEFAULT_RULES, ...customRules];

  try {
    if (ext === '.vue') {
      const { descriptor } = vueParse(content);
      
      // A. 扫描模板中的 Vue 指令 (v-html)
      if (descriptor.template) {
        const templateContent = descriptor.template.content;
        const vueRule = activeRules.find(r => r.type === 'vueInstruction');
        
        // 简单正则预筛，提高性能
        if (vueRule && templateContent.includes(vueRule.name)) {
          // 这里可以使用更高级的 compiler-dom 解析，为保持轻量先用精准正则
          const vHtmlRegex = /v-html=["']([^"']+)["']/g;
          let match;
          const templateOffset = descriptor.template.loc.start.offset;
          while ((match = vHtmlRegex.exec(templateContent)) !== null) {
            sinks.push({
              type: vueRule.message,
              bindingExpression: match[1],
              codeSnippet: match[0],
              start: templateOffset + match.index,
              end: templateOffset + match.index + match[0].length,
              isVueTemplate: true
            });
          }
        }
      }

      // B. 扫描脚本部分的 AST
      const script = descriptor.script || descriptor.scriptSetup;
      if (script) {
        const scriptOffset = script.loc.start.offset;
        const ast = babelParser.parse(script.content, { 
          sourceType: 'module', 
          plugins: ['jsx', 'typescript', 'decorators-legacy'] 
        });
        traverse(ast, {
          AssignmentExpression(p) { checkJsNode(p, script.content, sinks, activeRules); },
          CallExpression(p) { checkJsNode(p, script.content, sinks, activeRules); },
          NewExpression(p) { checkJsNode(p, script.content, sinks, activeRules); }
        });
        sinks.forEach(s => {
          if (!s.isVueTemplate) {
            s.start += scriptOffset;
            s.end += scriptOffset;
          }
        });
      }
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });
      traverse(ast, {
        AssignmentExpression(p) { checkJsNode(p, content, sinks, activeRules); },
        CallExpression(p) { checkJsNode(p, content, sinks, activeRules); },
        NewExpression(p) { checkJsNode(p, content, sinks, activeRules); },
        JSXAttribute(p) {
          const attrName = p.node.name.name;
          const rule = activeRules.find(r => (r.type === 'property' || r.type === 'jsxAttribute') && r.name === attrName);
          if (rule) {
            // JSX 属性通常需要替换整个属性
            sinks.push({
              type: rule.message,
              codeSnippet: content.substring(p.node.start, p.node.end),
              start: p.node.start,
              end: p.node.end,
              isJsxAttribute: true
            });
          }
        }
      });
    }
  } catch (e) {
    // 忽略解析错误
  }

  return sinks.length > 0 ? { sinks, content, ext } : null;
}

module.exports = { scanFile };
