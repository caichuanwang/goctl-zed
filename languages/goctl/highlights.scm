[
  "syntax"
  "import"
  "info"
  "type"
  "service"
  "struct"
  "interface"
  "map"
  "returns"
  "as"
] @keyword

(HTTPMETHOD) @function.method

[
  "@doc"
  "@server"
  "@handler"
] @attribute

(serviceName) @type
(structNameId) @type
(referenceId) @type
(body (GOTYPE) @type.builtin)
(GOTYPE) @type.builtin

(fieldName) @property
(key) @property
(handlerValue) @function
(identValue) @variable

(PATH) @string.special
(VALUE) @string
(RAW_STRING) @string.special
(NUMBER) @number
(DURATION) @number
(comment) @comment

[
  "="
  ":"
  ";"
  ","
] @punctuation.delimiter

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

"*" @operator
