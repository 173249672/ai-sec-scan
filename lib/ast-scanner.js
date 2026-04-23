const fs = require('fs');
const path = require('path');
const { parse: vueParse } = require('@vue/compiler-sfc');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const TypeScript = require('tree-sitter-typescript').typescript;
const TSX = require('tree-sitter-typescript').tsx;
const Vue = require('tree-sitter-vue');
const HTML = require('tree-sitter-html');

const { Query } = Parser;

// Initialize parsers
const jsParser = new Parser(); jsParser.setLanguage(JavaScript);
const tsParser = new Parser(); tsParser.setLanguage(TypeScript);
const tsxParser = new Parser(); tsxParser.setLanguage(TSX);
const vueParser = new Parser(); 
const htmlParser = new Parser(); htmlParser.setLanguage(HTML);

try {
  vueParser.setLanguage(Vue);
} catch (e) {
  // 如果 tree-sitter-vue 加载失败，回退到 HTML 解析器来处理模板
  vueParser.setLanguage(HTML);
}

const rulesPath = path.join(__dirname, 'rules');

// Helper to load queries, filtering out incompatible nodes for a specific language
function safeLoadQuery(lang, fileName) {
  const content = fs.readFileSync(path.join(rulesPath, fileName), 'utf8');
  try {
    return new Query(lang, content);
  } catch (e) {
    // If it fails, we try to extract only the parts that might work for this language
    // or just return null if the language is completely different.
    return null;
  }
}

const queries = {
  javascript: {
    injections: safeLoadQuery(JavaScript, 'injections.scm'),
    xss: safeLoadQuery(JavaScript, 'xss.scm'),
    secrets: safeLoadQuery(JavaScript, 'secrets.scm')
  },
  typescript: {
    injections: safeLoadQuery(TypeScript, 'injections.scm'),
    xss: safeLoadQuery(TypeScript, 'xss.scm'),
    secrets: safeLoadQuery(TypeScript, 'secrets.scm')
  },
  tsx: {
    injections: safeLoadQuery(TSX, 'injections.scm'),
    xss: safeLoadQuery(TSX, 'xss.scm'),
    secrets: safeLoadQuery(TSX, 'secrets.scm')
  },
  vue: {
    xss: safeLoadQuery(Vue, 'xss.scm')
  },
  html: {
    xss: safeLoadQuery(HTML, 'xss.scm')
  }
};

function getScannerConfig(ext, lang) {
  if (ext === '.vue') return { parser: vueParser, queries: queries.vue, name: 'vue' };
  if (ext === '.html') return { parser: htmlParser, queries: queries.html, name: 'html' };
  if (ext === '.ts') return { parser: tsParser, queries: queries.typescript, name: 'typescript' };
  if (ext === '.tsx') return { parser: tsxParser, queries: queries.tsx, name: 'tsx' };
  if (lang === 'ts') return { parser: tsParser, queries: queries.typescript, name: 'typescript' };
  if (lang === 'tsx') return { parser: tsxParser, queries: queries.tsx, name: 'tsx' };
  return { parser: jsParser, queries: queries.javascript, name: 'javascript' };
}

// Helper to convert legacy config rules to Tree-sitter queries
function generateDynamicQuery(lang, customRules) {
  if (!customRules || customRules.length === 0) return null;
  
  let scmParts = [];
  customRules.forEach((rule, idx) => {
    if (rule.type === 'property') {
      scmParts.push(`
        (assignment_expression
          left: (member_expression property: (property_identifier) @prop)
          (#eq? @prop "${rule.name}")
        ) @custom_${idx}
        
        (member_expression
          property: (property_identifier) @prop
          (#eq? @prop "${rule.name}")
        ) @custom_${idx}
      `);
    } else if (rule.type === 'call') {
      scmParts.push(`
        (call_expression
          function: [
            (identifier) @name
            (member_expression property: (property_identifier) @name)
          ]
          (#eq? @name "${rule.name}")
        ) @custom_${idx}
      `);
    }
  });

  try {
    return new Query(lang, scmParts.join('\n'));
  } catch (e) {
    return null;
  }
}

function runQueries(tree, sourceCode, langQueries, customQuery) {
  const sinks = [];
  
  // 1. Run standard queries from files
  if (langQueries) {
    for (const [category, query] of Object.entries(langQueries)) {
      if (!query) continue;
      const matches = query.matches(tree.rootNode);
      for (const match of matches) {
        const capture = match.captures.find(c => ['vulnerability', 'potential_xss', 'dynamic_regex'].includes(c.name));
        if (capture) {
          const node = capture.node;
          let targetNode = node;
          let p = node.parent;
          while (p && !['expression_statement', 'variable_declaration', 'lexical_declaration', 'attribute', 'element'].includes(p.type)) {
            p = p.parent;
          }
          if (p) targetNode = p;

          sinks.push({
            label: capture.name,
            category: category,
            type: getMessageForCategory(category, capture.name),
            codeSnippet: sourceCode.substring(targetNode.startIndex, targetNode.endIndex),
            start: targetNode.startIndex,
            end: targetNode.endIndex
          });
        }
      }
    }
  }

  // 2. Run custom dynamic query from user config
  if (customQuery) {
    const matches = customQuery.matches(tree.rootNode);
    matches.forEach(match => {
      match.captures.forEach(capture => {
        const idx = parseInt(capture.name.split('_')[1]);
        // Note: The caller of scanFile should have merged customRules into a known order
        // We'll handle the message retrieval later or pass it in.
        // For simplicity, we'll store the idx and the caller will fill the details.
        const node = capture.node;
        let targetNode = node;
        let p = node.parent;
        while (p && !['expression_statement', 'variable_declaration', 'lexical_declaration'].includes(p.type)) {
          p = p.parent;
        }
        if (p) targetNode = p;

        sinks.push({
          label: 'custom',
          category: 'custom',
          customIdx: idx,
          codeSnippet: sourceCode.substring(targetNode.startIndex, targetNode.endIndex),
          start: targetNode.startIndex,
          end: targetNode.endIndex
        });
      });
    });
  }

  return sinks;
}

function getMessageForCategory(category, label) {
  if (label === 'dynamic_regex') return '正则表达式注入 (ReDoS) 风险';
  if (label === 'potential_xss') return '潜在 XSS 注入点 (原始 HTML 渲染)';
  
  const messages = {
    injections: '关键位置注入风险 (Injection)',
    xss: '跨站脚本攻击风险 (XSS)',
    secrets: '硬编码敏感信息风险 (Secret)',
    custom: '用户自定义安全规则命中'
  };
  return messages[category] || '安全漏洞风险';
}

function scanFile(filePath, userConfig = {}) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  let sinks = [];

  const customRules = (userConfig.scanner && userConfig.scanner.customRules) || [];

  try {
    if (ext === '.vue') {
      const { descriptor } = vueParse(content);
      
      // 1. Scan Template (Vue/HTML)
      if (descriptor.template) {
        const templateContent = descriptor.template.content;
        const templateOffset = descriptor.template.loc.start.offset;
        const config = getScannerConfig('.vue');
        const tree = config.parser.parse(templateContent);
        const templateSinks = runQueries(tree, templateContent, config.queries);
        
        templateSinks.forEach(s => {
          s.start += templateOffset;
          s.end += templateOffset;
          s.isVueTemplate = true;
          sinks.push(s);
        });
      }

      // 2. Scan Script (JS/TS)
      const script = descriptor.script || descriptor.scriptSetup;
      if (script) {
        const scriptOffset = script.loc.start.offset;
        const config = getScannerConfig('.js', script.lang);
        const tree = config.parser.parse(script.content);
        
        const customQuery = generateDynamicQuery(config.parser.getLanguage(), customRules);
        const scriptSinks = runQueries(tree, script.content, config.queries, customQuery);

        scriptSinks.forEach(s => {
          if (s.category === 'custom') {
            const rule = customRules[s.customIdx];
            s.type = rule.message;
          }
          s.start += scriptOffset;
          s.end += scriptOffset;
          sinks.push(s);
        });
      }
    } else {
      const config = getScannerConfig(ext);
      const tree = config.parser.parse(content);
      const customQuery = generateDynamicQuery(config.parser.getLanguage(), customRules);
      sinks = runQueries(tree, content, config.queries, customQuery);
      
      sinks.forEach(s => {
        if (s.category === 'custom') {
          const rule = customRules[s.customIdx];
          s.type = rule.message;
        }
      });
    }
  } catch (e) {
    // console.error(`Error scanning ${filePath}:`, e);
  }

  return sinks.length > 0 ? { sinks, content, ext } : null;
}

module.exports = { scanFile };
