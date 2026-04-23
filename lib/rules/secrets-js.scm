; 专门抓取“变量名含敏感词”且“直接赋值为字符串”的情况
(variable_declarator
  name: (identifier) @var_name
  value: (string) @val
  (#match? @var_name "[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]|[Tt][Oo][Kk][Ee][Nn]|[Ss][Ee][Cc][Rr][Ee][Tt]|[Kk][Ee][Yy]|[Aa][Pp][Ii]_[Kk][Ee][Yy]")
) @vulnerability

(assignment_expression
  left: (identifier) @var_name
  right: (string) @val
  (#match? @var_name "[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]|[Tt][Oo][Kk][Ee][Nn]|[Ss][Ee][Cc][Rr][Ee][Tt]|[Kk][Ee][Yy]|[Aa][Pp][Ii]_[Kk][Ee][Yy]")
) @vulnerability
