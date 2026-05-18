## 1. Extension Skeleton

- [x] 1.1 Inspect current Zed extension conventions and decide the minimal manifest/source layout for a language extension in this repository.
- [x] 1.2 Add the Zed extension manifest that registers the goctl extension metadata.
- [x] 1.3 Register the `goctl` language for `.api` files with the required language asset paths.
- [x] 1.4 Add a sample `.api` fixture that includes info, import, type, service, annotations, handlers, routes, tags, comments, strings, and numeric literals.

## 2. Language Assets

- [x] 2.1 Add the goctl Tree-sitter grammar wiring and Zed query assets covering the upstream `goctl-vscode` highlighting surface.
- [x] 2.2 Add editor language configuration for `//`, `/* */`, bracket pairs, auto-closing pairs, and surrounding pairs.
- [x] 2.3 Add snippets for imports, info blocks, services, type/struct blocks, handlers, tags, annotations, and common HTTP methods.
- [x] 2.4 Verify the language asset paths are referenced correctly by the manifest and load without schema or path errors.

## 3. Formatting

- [x] 3.1 Identify the Zed extension API surface for document formatting or command-based formatting in the local toolchain.
- [x] 3.2 Implement goctl formatter invocation for `.api` documents using the installed `goctl` executable.
- [x] 3.3 Preserve document contents and surface a clear error when `goctl` is missing or exits unsuccessfully.
- [x] 3.4 Add focused tests or a local verification harness for formatter command construction and error handling where the Zed runtime permits it.

## 4. Navigation

- [x] 4.1 Implement lightweight same-file symbol extraction for service names, type declarations, handler annotations, route request types, and route response types.
- [x] 4.2 Implement definition navigation for same-file type and handler references where Zed exposes the required provider API.
- [x] 4.3 Implement reference navigation for same-file type and handler occurrences where Zed exposes the required provider API.
- [x] 4.4 Implement direct `import "relative.api"` type-definition lookup for route request/response definitions.
- [x] 4.5 Add semantic token highlighting so route request/response type names are highlighted only when their declarations resolve locally or through direct imports.

## 5. Documentation

- [x] 5.1 Add README instructions for installing or loading the Zed extension locally.
- [x] 5.2 Document the supported feature set: syntax highlighting, snippets, formatting, same-file navigation, direct-import type navigation, and resolved route type highlighting.
- [x] 5.3 Document the `goctl` CLI dependency and troubleshooting steps for PATH or formatter failures.
- [x] 5.4 Document first-version limitations: no syntax diagnostics and no project-wide import graph/reference navigation.

## 6. Verification

- [x] 6.1 Run repository formatting or lint checks available for the chosen Zed extension implementation stack.
- [x] 6.2 Run focused unit tests or fixture checks for grammar, snippets, formatter behavior, and symbol extraction.
- [x] 6.3 Manually load the extension in Zed if the local environment supports it and verify `.api` recognition, highlighting, snippets, formatting, and navigation on the sample fixture.
- [x] 6.4 Run `openspec validate implement-goctl-zed-plugin --strict` and fix any proposal/spec/task validation issues.
