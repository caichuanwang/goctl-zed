## Why

go-zero users who work in Zed currently do not have first-class `.api` editor support comparable to the existing `goctl-vscode` extension. Providing the same core workflow in Zed removes an editor adoption gap for goctl API files without changing goctl itself.

## What Changes

- Add a Zed extension for `.api` files using the `goctl` language identity.
- Provide Tree-sitter-based syntax highlighting aligned with the upstream `goctl-vscode` highlighting surface for goctl API files.
- Provide language configuration behavior for line/block comments, brackets, auto-closing pairs, and surrounding pairs.
- Provide snippets matching the upstream `goctl-vscode` code block hints for imports, info blocks, services, types, handlers, tags, docs, server blocks, and common HTTP routes.
- Provide symbol navigation for definitions and references for goctl API declarations where Zed extension APIs support it, including direct-import type definitions for route request/response types.
- Highlight route request/response type names only when the type declaration resolves in the active file or a directly imported `.api` file.
- Provide document formatting by invoking the installed `goctl` CLI formatter.
- Document installation, usage, goctl CLI dependency expectations, and unsupported first-version features.
- Keep syntax diagnostics and project-wide import graph/reference navigation out of first-version scope.

## Capabilities

### New Capabilities
- `goctl-api-editor-support`: Zed extension support for goctl `.api` files, including syntax highlighting, editor configuration, snippets, direct-import type definition navigation, resolved route type highlighting, same-file references, and goctl CLI formatting.

### Modified Capabilities
- None.

## Impact

- Adds Zed extension source and manifest files.
- Adds Tree-sitter grammar wiring, query, snippet, and language configuration assets derived from the public behavior of `zeromicro/goctl-vscode`.
- Adds tests or verification fixtures for grammar scopes, snippet registration, symbol extraction, and formatter command construction where the Zed extension runtime allows local validation.
- Requires the `goctl` CLI to be installed and discoverable on `PATH` for formatting.
