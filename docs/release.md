# Release goctl for Zed

This checklist follows Zed's official extension registry flow: publish a public extension repository, provide required runtime assets outside the extension package, then open a PR against `zed-industries/extensions`.

## Preconditions

- `extension.toml` has stable id `goctl`, version `0.1.0`, and repository `https://github.com/caichuanwang/goctl-zed`.
- `LICENSE` exists at the repository root.
- `server/goctl-api-lsp.mjs` is executable and is not treated as a language server bundled into the published extension runtime. Public installs resolve `goctl-api-lsp` from PATH, cached download, or the GitHub Release asset.
- Node.js is required when no native `goctl-api-lsp` executable is installed.
- `goctl` must be installed on user PATH for formatting.

## Local Verification

Run these before tagging or submitting to Zed:

```sh
node --test scripts/test.mjs
cargo check
cargo build --target wasm32-wasip2
openspec validate --specs --strict
openspec validate --changes --strict
```

Also rebuild the dev extension in Zed and smoke test:

- `.api` file is recognized as `goctl`.
- `CreateUserRequest` in `fixtures/sample.api` jumps to `fixtures/types.api`.
- Resolved route request/response types are highlighted.
- An unresolved request type is not highlighted as a type.
- Snippets appear for common triggers such as `info`, `service`, `post`, and `json`.
- Formatting reports a clear error when `goctl` is unavailable.

## GitHub Release

Create release `v0.1.0` in `caichuanwang/goctl-zed` and attach `server/goctl-api-lsp.mjs` with the asset name exactly `goctl-api-lsp.mjs`.

Using GitHub CLI after authentication:

```sh
git push origin master
gh release create v0.1.0 server/goctl-api-lsp.mjs#goctl-api-lsp.mjs \
  --repo caichuanwang/goctl-zed \
  --title "goctl-zed v0.1.0" \
  --notes "Initial Zed extension release for goctl .api files."
```

Validate the asset:

```sh
curl -fsSL https://github.com/caichuanwang/goctl-zed/releases/download/v0.1.0/goctl-api-lsp.mjs -o /tmp/goctl-api-lsp.mjs
node --check /tmp/goctl-api-lsp.mjs
```

## Official Zed Registry PR

Before editing the registry, re-check that `goctl` is still unclaimed:

```sh
curl -fsSL https://raw.githubusercontent.com/zed-industries/extensions/main/extensions.toml | grep '^\[goctl\]' || true
```

In a fork of `zed-industries/extensions`:

```sh
git submodule add https://github.com/caichuanwang/goctl-zed.git extensions/goctl
```

Add this entry to `extensions.toml`:

```toml
[goctl]
submodule = "extensions/goctl"
version = "0.1.0"
```

Then run the official sort command and commit:

```sh
pnpm sort-extensions
git add .gitmodules extensions.toml extensions/goctl
git commit -m "Add goctl extension"
```

Open a PR to `zed-industries/extensions` and include:

- Repository: `https://github.com/caichuanwang/goctl-zed`
- Version: `0.1.0`
- Release asset: `goctl-api-lsp.mjs`
- Local validation results
- Manual Zed dev-extension smoke-test notes

## Post-Merge

After the PR is merged, install `goctl` from Zed's Extensions UI and verify `fixtures/sample.api` behavior from a fresh user install.
