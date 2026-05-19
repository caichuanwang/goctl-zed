## Why

The goctl Zed extension now has core editor support, but it is not yet ready for official Zed distribution. Publishing requires aligning the repository, release artifacts, validation evidence, and `zed-industries/extensions` PR with Zed's official extension registry process.

## What Changes

- Prepare this repository for public Zed extension submission, including release metadata, license/readme checks, language server release asset expectations, and verification output.
- Create a repeatable release checklist for producing the `goctl-api-lsp.mjs` GitHub Release asset consumed by the extension at runtime.
- Prepare the official registry submission against `zed-industries/extensions` using the extension submodule and `extensions.toml` entry expected by Zed.
- Document post-submit maintenance steps for version bumps, release assets, and registry updates.
- Do not change the goctl language feature surface unless a release-blocking validation issue is found.

## Capabilities

### New Capabilities
- `zed-extension-publication`: Official Zed extension publication workflow for `goctl-zed`, covering repository readiness, release asset creation, registry PR preparation, and post-release verification.

### Modified Capabilities
- `goctl-api-editor-support`: Clarify publication-oriented language server distribution requirements and release verification expectations without changing editor behavior.

## Impact

- Affects release/documentation files in this repository, including README, OpenSpec specs, release notes/checklists, and potentially extension metadata.
- May require a GitHub Release in `caichuanwang/goctl-zed` containing `goctl-api-lsp.mjs` before public users can install the registry extension successfully.
- Requires a fork/clone of `zed-industries/extensions` for the official registry PR.
- Requires local validation evidence: JS tests, Rust checks/build, OpenSpec validation, and manual Zed dev-extension smoke testing before PR submission.
