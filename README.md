# goctl for Zed

Zed language support for go-zero `goctl` `.api` files, modeled after the implemented feature set in `zeromicro/goctl-vscode`.

## Features

- `.api` file association with the `goctl` language.
- Tree-sitter syntax highlighting for goctl API files.
- Comment, bracket, auto-closing, and surrounding-pair editor configuration.
- Snippets for imports, `info`, `service`, `type`, handlers, field tags, annotations, and common HTTP routes.
- Formatting through the installed `goctl` CLI.
- Definition, reference, and document-symbol support through a lightweight LSP.
- Direct `import "relative.api"` type-definition lookup for route request/response types.
- Route request/response type names are highlighted only when the type resolves in the active file or a directly imported `.api` file.

## Install Locally

1. Install `goctl` and make sure it is available on `PATH`:

   ```sh
   goctl --version
   ```

2. Install Node.js. The extension uses Node to run the lightweight language server when a native `goctl-api-lsp` executable is not available.

3. Install this repository as a Zed dev extension:

   - Open the Zed command palette.
   - Run `zed: extensions`.
   - Choose `Install Dev Extension`.
   - Select this repository directory.

4. Open `fixtures/sample.api` or any `.api` file.

## Formatting

Formatting uses:

```sh
goctl api format --stdin
```

If formatting fails, check that `goctl` is installed, executable, and visible to the environment used by Zed. You can set `GOCTL_BIN` before launching Zed to point the language server at a specific binary path.

## Language Server Resolution

For public releases, the extension does not launch a language server bundled inside the extension package. At startup it resolves the server in this order:

1. Use `goctl-api-lsp` from the user's `PATH` when available.
2. Use a previously downloaded `goctl-api-lsp.mjs` from the Zed extension work directory.
3. Use the repository-local `server/goctl-api-lsp.mjs` when running as a dev extension.
4. Otherwise, download `goctl-api-lsp.mjs` from the latest GitHub Release for `caichuanwang/goctl-zed` into the Zed extension work directory and run it with Node.

For local development before a GitHub Release exists, installing this repository as a dev extension uses `server/goctl-api-lsp.mjs` directly. You can also force the PATH branch:

```sh
mkdir -p .local/bin
ln -sf "$PWD/server/goctl-api-lsp.mjs" .local/bin/goctl-api-lsp
PATH="$PWD/.local/bin:$PATH" zed .
```

For public releases, attach `server/goctl-api-lsp.mjs` to the GitHub Release as `goctl-api-lsp.mjs`.

## Snippets

The extension registers `snippets/goctl.json`. Useful triggers include:

- `im`
- `info`
- `service`
- `type` / `tys`
- `handler` / `@handler`
- `@doc` / `@server`
- `json` / `path` / `form`
- `get` / `post` / `put` / `delete`

## Current Limitations

- Syntax diagnostics are not implemented.
- Cross-file references are not implemented.
- Recursive import graph resolution is not implemented; only direct relative `.api` imports are followed for type definitions.

## Development

Run local checks:

```sh
npm test
cargo check
openspec validate implement-goctl-zed-plugin --strict
```

To build the extension for Zed's WebAssembly target:

```sh
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2
```
