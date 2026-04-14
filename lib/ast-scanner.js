const fs = require('fs');
const path = require('path');
const { parse: vueParse } = require('@vue/compiler-sfc');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// 检查 JS/TS 节点是否包含危险属性
function checkJsNode(path, scriptContent, sinks) {
  const node = path.node;
  if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
    const propName = node.left.property.name;
    const dangerProps = ['innerHTML', 'href', 'dangerouslySetInnerHTML'];

    if (dangerProps.includes(propName)) {
      sinks.push({
        type: `JS 危险操作 (${propName})`,
        bindingExpression: scriptContent.substring(node.right.start, node.right.end),
        codeSnippet: scriptContent.substring(node.start, node.end)
      });
    }
  }

  // 针对 Node.js: 查找 exec, eval 等命令注入风险
  if (node.type === 'CallExpression') {
    const calleeName = node.callee.name || (node.callee.property && node.callee.property.name);
    const serverSinks = ['exec', 'eval', 'readFile', 'readFileSync', 'query'];
    if (serverSinks.includes(calleeName)) {
      sinks.push({
        type: `服务端敏感调用 (${calleeName})`,
        bindingExpression: '函数参数',
        codeSnippet: scriptContent.substring(node.start, node.end)
      });
    }
  }
}

function scanFile(filePath) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const sinks = [];

  try {
    if (ext === '.vue') {
      // Vue 2/3 处理
      const { descriptor } = vueParse(content);
      const script = descriptor.script || descriptor.scriptSetup;
      if (script) {
        const ast = babelParser.parse(script.content, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
        traverse(ast, {
          AssignmentExpression(p) { checkJsNode(p, script.content, sinks); },
          CallExpression(p) { checkJsNode(p, script.content, sinks); }
        });
      }
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      // React, Node, Next.js 处理
      const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });
      traverse(ast, {
        AssignmentExpression(p) { checkJsNode(p, content, sinks); },
        CallExpression(p) { checkJsNode(p, content, sinks); },
        // 针对 React JSX 的特殊处理
        JSXAttribute(p) {
          if (p.node.name.name === 'dangerouslySetInnerHTML') {
            sinks.push({
              type: 'React 风险属性 (dangerouslySetInnerHTML)',
              codeSnippet: content.substring(p.node.start, p.node.end)
            });
          }
        }
      });
    }
  } catch (e) {
    // 忽略解析失败的文件
  }

  return sinks.length > 0 ? { sinks, content, ext } : null;
}

module.exports = { scanFile };
