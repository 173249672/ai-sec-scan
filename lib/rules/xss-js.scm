; DOM 危险操作 (innerHTML/outerHTML)
(assignment_expression
  left: (member_expression
    property: (property_identifier) @prop)
  (#match? @prop "^(innerHTML|outerHTML)$")
) @vulnerability

; 敏感属性赋值
(assignment_expression
  left: (member_expression
    property: (property_identifier) @prop)
  (#match? @prop "^(href|src|cookie|domain)$")
) @vulnerability

; React 风险属性 (dangerouslySetInnerHTML)
(jsx_attribute
  name: (property_identifier) @name
  (#eq? @name "dangerouslySetInnerHTML")
) @vulnerability

; Vue 指令中的危险操作 (v-html, v-bind:src)
(attribute
  (attribute_name) @attr_name
  (#match? @attr_name "^(v-html|v-bind:src|v-bind:href)$")
) @vulnerability

; Vue 3 的原始 HTML 渲染 (注：如果使用 HTML 引擎回退，此处会被忽略)
; (interpolation
;   (identifier) @content
; ) @potential_xss
