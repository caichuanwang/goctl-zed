## Context

This repository is currently an OpenSpec-ready shell for a Zed extension. The requested product target is parity with `zeromicro/goctl-vscode` for the features that extension documents as implemented: syntax highlighting, definition/reference jumps, formatting through the `goctl` command, and code block hints.

Zed extensions are not VS Code extensions, so the implementation cannot directly reuse VS Code activation events, TypeScript extension APIs, or VS Code TextMate grammar registration. The durable parts to port are the language identity, `.api` file association, highlighting behavior, snippets, editor pairing/comment configuration, goctl CLI formatter integration, and lightweight symbol navigation behavior.

## Goals / Non-Goals

**Goals:**
- Provide a usable Zed extension for go-zero `.api` files.
- Match the visible `goctl-vscode` feature surface for supported first-version features.
- Keep assets and behavior small enough to validate locally with fixtures.
- Fail gracefully when `goctl` is unavailable for formatting.
- Document clear installation and troubleshooting steps for Zed users.

**Non-Goals:**
- Do not implement syntax error diagnostics in the first version.
- Do not implement project-wide cross-file reference navigation or recursive import graph analysis in the first version.
- Do not ship or vendor the `goctl` binary.
- Do not add a language server unless Zed APIs make it necessary for the requested parity.
- Do not broaden support to non-`.api` go-zero file types.

## Decisions

1. Use Zed-native language assets for the static editor behavior.

   The extension will register a `goctl` language for `.api` files and provide grammar, bracket/comment configuration, and snippets as extension assets. This mirrors the stable part of `goctl-vscode` without carrying VS Code-specific packaging or activation code.

   Rejected alternative: wrap the VS Code extension directly. Zed does not consume VS Code extension manifests or activation events, and such wrapping would leave core behavior untestable in this repository.

2. Base static syntax highlighting on Tree-sitter grammar and Zed queries, with resolved route types handled by semantic tokens.

   Zed requires a Tree-sitter grammar for language extensions. The implementation will register an existing MIT-licensed goctl Tree-sitter grammar and provide Zed query files that preserve the stable highlighting surface from `goctl-vscode`, including `service`, HTTP methods, `@doc`, `@server`, `@handler`, route declarations, type declarations, comments, strings, numeric literals, and common Go-like storage types. Route request/response type names are semantic rather than purely syntactic, so the lightweight LSP will publish semantic tokens only for names that resolve to a local or directly imported type declaration.

   Rejected alternative: port the VS Code TextMate grammar directly. Zed's language extension model is Tree-sitter-first, so a direct TextMate port would not provide native Zed language support.
   Rejected alternative: keep static Tree-sitter captures for all route request/response identifiers. That would highlight misspelled or missing type names, which conflicts with the desired "defined types only" behavior.

3. Implement snippets as data, not code.

   Snippets for `im`, `info`, `service`, `type`, `tys`, `handler`, tag helpers, `@doc`, `@server`, `@handler`, and common HTTP methods will live in repository assets so they are easy to review and compare against upstream behavior.

   Rejected alternative: generate snippets dynamically. The snippet set is static and small, so generation adds avoidable complexity.

4. Implement formatting as a goctl CLI invocation through a lightweight LSP.

   Formatting will call the installed `goctl` command on the current `.api` document using LSP `textDocument/formatting`. The extension must surface a clear error if the executable cannot be found or returns a non-zero exit status.

   Rejected alternative: reimplement formatting in the extension. The CLI is the canonical formatter, and duplicating it risks behavior drift.

5. Keep navigation lightweight and serve it from the LSP.

   Definition/reference support will index symbols declared in the active `.api` file, including type declarations, service names, handler declarations, and request/response identifiers referenced in routes. For route request/response types, definition navigation will also inspect directly imported relative `.api` files such as `import "types.api"` and jump to matching type declarations. Reference navigation remains file-local in this first version.

   Rejected alternative: add project-wide recursive import graph resolution immediately. It has higher correctness and performance risk and is unnecessary for the direct `sample.api` -> `types.api` workflow.

## Risks / Trade-offs

- Zed extension APIs may not expose direct equivalents for every VS Code feature -> Build the first implementation around the closest native surface and document any unavoidable gap.
- Tree-sitter node names from the upstream goctl grammar may not map perfectly to every goctl-vscode highlighting detail -> Verify with sample `.api` fixtures and adjust Zed query captures only where Zed rendering requires it.
- Formatter behavior depends on the user's shell environment and `PATH` -> Provide clear error messages and a setting or documented workaround if Zed cannot locate `goctl`.
- Symbol navigation based on lightweight parsing can miss unusual goctl syntax -> Cover common goctl-vscode demo cases and direct relative imports first, and keep recursive graph resolution or full diagnostics for later changes.
- Upstream snippets contain historical placeholder typos such as `RequestBoday` and `ResponseBoday` -> Preserve parity unless a typo blocks usability, and document any intentional correction in implementation notes.

## Migration Plan

1. Add the Zed extension manifest and language assets.
2. Add sample `.api` fixtures that exercise highlighting, snippets, formatting, and navigation.
3. Implement formatter and single-file navigation behavior.
4. Add README usage instructions and troubleshooting guidance.
5. Verify extension packaging and local behavior in Zed where possible.

Rollback is straightforward because the change is additive: remove the extension files and OpenSpec change artifacts if the implementation path proves incompatible with current Zed APIs.

## Open Questions

- Which exact Zed extension API version is available in the user's local environment at implementation time?
- Does Zed support formatter registration for this extension type directly, or does formatting need to be exposed through an extension command?
- Does Zed expose enough symbol-provider API surface for direct definition/reference support, or should the first implementation use the smallest supported navigation primitive?
