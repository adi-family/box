; Tree-sitter highlight queries for Box.
;
; Capture names follow tree-sitter conventions and the Zed standard set:
; @keyword, @string, @number, @boolean, @comment, @function, @type,
; @variable, @property, @punctuation, @operator, @constant.

; ---------- Keywords ----------

[
  "use"
  "import"
  "export"
  "as"
  "model"
  "enum"
  "alias"
] @keyword

[
  "true"
  "false"
] @boolean

(null) @constant.builtin

; ---------- Literals ----------

(string)  @string
(number)  @number
(boolean) @boolean

; ---------- Comments ----------

(line_comment)  @comment
(block_comment) @comment

; ---------- Punctuation ----------

[
  "{" "}"
  "[" "]"
  "("  ")"
] @punctuation.bracket

[
  ","
  ":"
  "."
  "?"
] @punctuation.delimiter

"=" @operator

; ---------- Kind blocks ----------

(kind_block
  kind: (identifier) @keyword.kind)

(child_block
  kind: (identifier) @keyword.kind)

; ---------- Field assignments ----------

(field_assignment
  name: (identifier) @property)

(named_argument
  name: (identifier) @property)

; ---------- Function calls ----------

(function_call
  name: (identifier) @function.call)

; ---------- Operation signatures ----------

(operation_signature
  op_name: (identifier) @function)

(op_parameter
  name: (identifier) @variable.parameter)

; ---------- Cross-block field references ----------

(dotted_path
  (identifier) @variable.namespace)

; ---------- Declarations ----------

(model_declaration
  name: (identifier) @type)

(enum_declaration
  name: (identifier) @type.enum)

(type_alias
  name: (identifier) @type)

(model_field
  name: (identifier) @property)

; ---------- Types ----------

(type_ref) @type

; ---------- Decorators ----------

(decorator
  "@" @punctuation.special)

(decorator
  (identifier) @function.macro)

; ---------- Statement aliases (`as <name>`) ----------

(use_statement
  alias: (identifier) @namespace)

(import_statement
  alias: (identifier) @namespace)

(export_statement
  alias: (identifier) @namespace)
