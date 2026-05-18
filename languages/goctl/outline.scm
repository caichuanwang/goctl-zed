(serviceSpec
  "service"
  (serviceName) @name) @item

(typeAlias
  "type"
  (structNameId) @name) @item

(typeStruct
  "type"
  (structType
    (structNameId) @name)) @item

(structType
  (structNameId) @name) @item

(serviceHandlerNew
  "@handler"
  (handlerValue) @name) @item

(serviceHandler
  "@server"
  (handlerPair
    (handlerValue) @name)) @item
