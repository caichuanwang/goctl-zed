## MODIFIED Requirements

### Requirement: Language server resolution
The extension SHALL resolve the goctl API language server from the user environment, a local development source, or an external release asset without requiring a language server bundled in the published extension package.

#### Scenario: User-installed language server exists
- **WHEN** `goctl-api-lsp` is available on the user's `PATH`
- **THEN** the extension launches that executable directly

#### Scenario: User-installed language server is missing
- **WHEN** `goctl-api-lsp` is not available on the user's `PATH`
- **THEN** the extension uses a cached download, a dev-extension-local script, or downloads `goctl-api-lsp.mjs` from the latest GitHub Release and runs the script with Node

#### Scenario: Published extension uses external language server distribution
- **WHEN** the extension is installed from the official Zed registry
- **THEN** the runtime language server is supplied by `PATH`, a cached download, or the GitHub Release asset rather than a server bundled inside the published extension package

### Requirement: User documentation
The extension SHALL document the supported feature set, installation steps, formatter dependency, language server distribution, and first-version limitations.

#### Scenario: Reading setup instructions
- **WHEN** a user reads the repository README
- **THEN** they can identify how to install or load the Zed extension and how to install `goctl` for formatting

#### Scenario: Reading limitation notes
- **WHEN** a user reads the repository README
- **THEN** they can identify that syntax diagnostics, recursive import graph resolution, and cross-file references are not part of the first version

#### Scenario: Reading release instructions
- **WHEN** a maintainer reads the repository release documentation
- **THEN** they can identify how `goctl-api-lsp.mjs` is distributed for public Zed users and what asset must be attached to the GitHub Release
