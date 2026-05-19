## 1. Repository Readiness

- [x] 1.1 Re-check Zed official extension publishing documentation and record any submission rules that affect this repository.
- [x] 1.2 Verify `extension.toml` metadata, `id`, `version`, repository URL, authors, grammar configuration, snippets, and language server entries are publication-ready.
- [x] 1.3 Confirm the `goctl` extension id is not already present in the official `zed-industries/extensions` registry before opening the PR.
- [x] 1.4 Ensure `.gitignore` excludes local build outputs and tool state while keeping required runtime/source assets tracked.
- [x] 1.5 Add or update release documentation for the official Zed publishing flow.

## 2. Language Server Release Asset

- [x] 2.1 Verify the extension runtime resolves `goctl-api-lsp` from PATH before downloading a release asset.
- [x] 2.2 Verify dev-extension fallback uses `server/goctl-api-lsp.mjs` without requiring a GitHub Release.
- [ ] 2.3 Prepare GitHub Release `v0.1.0` for `caichuanwang/goctl-zed` with asset name `goctl-api-lsp.mjs` sourced from `server/goctl-api-lsp.mjs`.
- [ ] 2.4 Validate the release asset can be downloaded and starts as an LSP script under Node.

## 3. Local Verification

- [x] 3.1 Run `node --test scripts/test.mjs`.
- [x] 3.2 Run `cargo check`.
- [x] 3.3 Run `cargo build --target wasm32-wasip2`.
- [x] 3.4 Run `openspec validate --specs --strict` and `openspec validate --changes --strict`.
- [ ] 3.5 Rebuild the dev extension in Zed and smoke test `.api` recognition, resolved route type highlighting, direct-import definition jump, snippets, and formatting error behavior.

## 4. Official Registry Submission

- [ ] 4.1 Fork or update a local checkout of `zed-industries/extensions`.
- [ ] 4.2 Add `https://github.com/caichuanwang/goctl-zed.git` as the `extensions/goctl` submodule at the release-ready commit.
- [ ] 4.3 Add the `[goctl]` entry to the registry `extensions.toml` with `submodule = "extensions/goctl"` and `version = "0.1.0"`.
- [ ] 4.4 Run the official registry sort/format command such as `pnpm sort-extensions`.
- [ ] 4.5 Commit the registry changes and open a PR to `zed-industries/extensions` with validation evidence and release asset notes.

## 5. Post-Submission Follow-Up

- [ ] 5.1 Respond to Zed reviewer feedback and adjust this repository or registry PR if required.
- [ ] 5.2 After merge, install `goctl` from Zed's Extensions UI and verify the sample `.api` workflow.
- [ ] 5.3 Archive this OpenSpec change after the registry PR is merged or the publication process reaches a documented stopping point.
