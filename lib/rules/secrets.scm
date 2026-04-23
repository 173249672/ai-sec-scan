; 专门抓取“变量名含敏感词”且“直接赋值为字符串”的情况
(variable_declarator
  name: (identifier) @name (#match? @name "(?i)(password|token|secret|key|api_key|apikey|passwd)")
  value: (string) @val
) @vulnerability

; 环境变量赋值
(assignment_expression
  left: (member_expression
    property: (property_identifier) @prop)
  right: (string)
  (#match? @prop "(?i)(password|token|secret|key|api_key|apikey|passwd)")
) @vulnerability
