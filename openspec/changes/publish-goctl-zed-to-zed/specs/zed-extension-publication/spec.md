## ADDED Requirements

### Requirement: Repository publication readiness
The release process SHALL prepare `goctl-zed` as a public Zed extension repository before registry submission.

#### Scenario: Repository metadata is complete
- **WHEN** the repository is checked for publication readiness
- **THEN** `extension.toml`, `README.md`, `LICENSE`, `Cargo.toml`, language assets, grammar assets, snippets, fixtures, tests, and OpenSpec specs are present and consistent

#### Scenario: Extension id is stable and unique
- **WHEN** the extension is prepared for the registry PR
- **THEN** the `goctl` id is confirmed against the official Zed registry and is not changed after submission

### Requirement: Language server release asset
The release process SHALL publish the goctl API language server as an external release asset consumable by the extension runtime.

#### Scenario: Release asset is attached
- **WHEN** GitHub Release `v0.1.0` is created for `caichuanwang/goctl-zed`
- **THEN** the release includes an asset named exactly `goctl-api-lsp.mjs`

#### Scenario: Release asset is validated
- **WHEN** the release asset is available
- **THEN** a validation command confirms the asset can be downloaded and contains the expected executable Node language server script

### Requirement: Official Zed registry PR
The release process SHALL submit `goctl-zed` to the official Zed extension registry using the upstream repository workflow.

#### Scenario: Registry submodule is added
- **WHEN** preparing the `zed-industries/extensions` PR
- **THEN** `https://github.com/caichuanwang/goctl-zed.git` is added as the `extensions/goctl` submodule at the release-ready commit

#### Scenario: Registry manifest entry is added
- **WHEN** preparing the `zed-industries/extensions` PR
- **THEN** `extensions.toml` contains a `[goctl]` entry with `submodule = "extensions/goctl"` and `version = "0.1.0"`

#### Scenario: Registry formatting is applied
- **WHEN** the registry entry is added
- **THEN** the official registry sorting/formatting command is run before committing the PR branch

### Requirement: Publication verification
The release process SHALL capture validation evidence before and after submission.

#### Scenario: Pre-submit validation passes
- **WHEN** the release-ready repository is prepared
- **THEN** JS tests, Rust checks/build, OpenSpec validation, and Zed dev-extension smoke testing have recorded passing evidence

#### Scenario: Post-merge installation is verified
- **WHEN** the upstream registry PR is merged
- **THEN** installing `goctl` from Zed's Extensions UI is verified against a sample `.api` file
