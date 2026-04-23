; Vue 指令中的危险操作 (v-html, v-bind:src)
(attribute
  (attribute_name) @attr_name
  (#match? @attr_name "^(v-html|v-bind:src|v-bind:href)$")
) @vulnerability
