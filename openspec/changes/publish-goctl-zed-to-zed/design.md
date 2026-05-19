## Context

Zed publishes community extensions through the public `zed-industries/extensions` registry. The extension source must live in a public repository, carry stable metadata and a license, and be registered in the official registry repository as a submodule plus `extensions.toml` entry. The current `goctl-zed` repository already contains the extension implementation and has been adjusted so the language server is resolved from user `PATH`, a cached download, local dev source, or a GitHub Release asset instead of relying on a language server bundled into the published extension package.

The release work now needs to make the repository and registry submission reproducible. The main moving parts are this repository, a GitHub Release asset named `goctl-api-lsp.mjs`, and a PR to `zed-industries/extensions` that points at a committed version of this repository.

## Goals / Non-Goals

**Goals:**
- Prepare `goctl-zed` for official Zed registry submission using Zed's documented extension process.
- Ensure the extension metadata, license, release assets, and README are sufficient for review and public installation.
- Produce a GitHub Release that exposes `goctl-api-lsp.mjs` for the extension's runtime download fallback.
- Prepare a clean `zed-industries/extensions` PR with the `extensions/goctl` submodule and matching `extensions.toml` entry.
- Preserve validation evidence so reviewer issues can be answered quickly.

**Non-Goals:**
- Do not broaden `.api` editor behavior beyond the already implemented feature set.
- Do not publish a package to npm or crates.io.
- Do not vendor the language server as a published extension runtime dependency.
- Do not automate merging into the official Zed registry; the upstream PR remains reviewer-controlled.

## Decisions

1. Treat GitHub Release assets as the default public language server distribution channel.

   The extension already checks `PATH` first, then cached/dev source, then GitHub Release. For public registry users, the dev source path will not be present, so the release asset is required. The asset name remains `goctl-api-lsp.mjs` to keep the Rust extension resolver simple and deterministic.

   Rejected alternative: include `server/goctl-api-lsp.mjs` as the runtime server inside the extension package. Zed's guidance discourages extensions with language servers from bundling the server directly; using a release asset is more review-friendly.

2. Keep the Zed extension repository as the source of truth and register it as a submodule in `zed-industries/extensions`.

   The official registry workflow expects a public extension repository and an `extensions.toml` entry in the registry repository. The submission should add `extensions/goctl` as a submodule pointing to the release-ready commit and add a `[goctl]` entry with version `0.1.0`.

   Rejected alternative: ask users to install only as a dev extension. That does not publish to Zed and does not satisfy the user's request.

3. Use a release checklist rather than hiding publication in ad hoc commands.

   Publishing spans two repositories and GitHub release state, so the implementation should add explicit release instructions and verification gates. This reduces the chance of submitting a registry PR before the `goctl-api-lsp.mjs` asset exists.

   Rejected alternative: only push the current repository and open the registry PR. Without a release asset, public installations can fail at language server startup.

## Risks / Trade-offs

- GitHub Release asset missing or misnamed -> Add checklist validation that `goctl-api-lsp.mjs` exists on the release before opening the registry PR.
- Zed reviewer requests metadata or packaging changes -> Keep changes scoped and preserve validation evidence for quick iteration.
- The `goctl` id is claimed before submission -> Re-check the official registry before PR creation and rename before publication if required.
- Public users without Node cannot run the downloaded `.mjs` server -> README must state Node is required when no native `goctl-api-lsp` executable is installed.
- Release PR points at the wrong commit -> Verify the registry submodule commit matches the pushed release-ready repository commit.

## Migration Plan

1. Finalize repository readiness in `goctl-zed`: metadata, README release docs, executable server script, tests, and validation.
2. Push the release-ready commit to the public `caichuanwang/goctl-zed` repository.
3. Create GitHub Release `v0.1.0` and attach `server/goctl-api-lsp.mjs` as `goctl-api-lsp.mjs`.
4. Validate the release asset URL is reachable and that dev-extension/runtime fallback behavior still works.
5. Fork or update `zed-industries/extensions`, add the `goctl-zed` repository as `extensions/goctl`, add the `[goctl]` entry in `extensions.toml`, run the registry sort command, and open the PR.
6. After merge, verify installation from Zed's Extensions UI and document any reviewer-required follow-up.

Rollback is simple before upstream merge: close or update the registry PR and delete or replace the GitHub Release asset. After merge, rollback requires a new registry PR that removes or updates the extension entry.
