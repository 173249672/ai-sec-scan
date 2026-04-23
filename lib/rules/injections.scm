; 动态代码执行
(call_expression
  function: (identifier) @name
  (#match? @name "^(eval|setTimeout|setInterval)$")
) @vulnerability

(new_expression
  constructor: (identifier) @name
  (#eq? @name "Function")
) @vulnerability

; 服务端命令注入 (Node.js child_process)
(call_expression
  function: [
    (identifier) @name
    (member_expression property: (property_identifier) @name)
  ]
  (#match? @name "^(exec|execSync|spawn|spawnSync|fork|execFile|execFileSync)$")
) @vulnerability

; 优化后的文件系统操作：只匹配参数不是字面量（即可能是变量）的情况
(call_expression
  function: [(identifier) @name (member_expression property: (property_identifier) @name)]
  arguments: (arguments ([(identifier) (member_expression) (call_expression)]) @payload)
  (#match? @name "^(readFile|readFileSync|writeFile|writeFileSync)$")
) @vulnerability

; 正则表达式注入 (ReDoS)
(new_expression
  constructor: (identifier) @name (#eq? @name "RegExp")
  arguments: (arguments [(identifier) (member_expression)]) @dynamic_regex
) @vulnerability
