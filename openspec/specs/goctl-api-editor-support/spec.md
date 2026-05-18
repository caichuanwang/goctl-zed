## Purpose
Provide Zed editor support for go-zero goctl `.api` files, including language registration, editor behavior, highlighting, snippets, formatting, navigation, and user documentation.

## Requirements

### Requirement: Goctl language registration
The extension SHALL register a `goctl` language for files with the `.api` extension.

#### Scenario: Opening an api file
- **WHEN** a user opens a file named `service.api` in Zed
- **THEN** Zed recognizes the file as the `goctl` language

#### Scenario: Editing non-api files
- **WHEN** a user opens a file without the `.api` extension
- **THEN** the goctl language registration does not claim that file by default

### Requirement: Editor pairing and comments
The extension SHALL configure goctl editor behavior for line comments, block comments, bracket pairs, auto-closing pairs, and surrounding pairs.

#### Scenario: Comment toggling
- **WHEN** a user toggles a line comment in a goctl file
- **THEN** the editor uses `//` for the comment marker

#### Scenario: Block comments
- **WHEN** a user creates or edits a block comment in a goctl file
- **THEN** the editor recognizes `/*` and `*/` as the block comment delimiters

#### Scenario: Bracket pairing
- **WHEN** a user types `{`, `[`, `(`, `"`, or `'` in a goctl file
- **THEN** the editor applies the configured matching pair where Zed supports automatic pairing

### Requirement: Syntax highlighting
The extension SHALL provide Tree-sitter syntax highlighting for goctl API files.

#### Scenario: Highlighting service declarations
- **WHEN** a goctl file contains `service user-api {`
- **THEN** `service` is highlighted as a goctl keyword and `user-api` is highlighted as a service name

#### Scenario: Highlighting route declarations
- **WHEN** a goctl file contains `get /users/:id(Request) returns(Response)`
- **THEN** the HTTP method, route path, and `returns` keyword receive distinct grammar scopes

#### Scenario: Highlighting resolved route types
- **WHEN** a route references `Request` or `Response` and that type is declared in the active file or a directly imported `.api` file
- **THEN** the type name receives a semantic type highlight

#### Scenario: Leaving unresolved route types unhighlighted
- **WHEN** a route references `MissingRequest` and no active-file or directly imported `.api` declaration exists for that type
- **THEN** `MissingRequest` does not receive a type semantic highlight

#### Scenario: Highlighting annotations
- **WHEN** a goctl file contains `@doc`, `@server`, and `@handler` blocks
- **THEN** the annotation names and nested identifiers receive goctl grammar scopes

#### Scenario: Highlighting types and literals
- **WHEN** a goctl file contains type declarations, strings, raw strings, numeric literals, field tags, and comments
- **THEN** the grammar assigns appropriate scopes for type names, strings, numbers, tags, and comments

### Requirement: Snippet completions
The extension SHALL provide snippet completions matching the practical code block hints from `goctl-vscode`.

#### Scenario: Inserting an info block
- **WHEN** a user triggers the `info` snippet in a goctl file
- **THEN** the editor inserts an `info(...)` block with placeholders for title, description, author, email, and version

#### Scenario: Inserting service and type blocks
- **WHEN** a user triggers the `service`, `type`, or `tys` snippets in a goctl file
- **THEN** the editor inserts the corresponding service or struct declaration with editable placeholders

#### Scenario: Inserting handler and route blocks
- **WHEN** a user triggers the `handler`, `@handler`, `get`, `post`, `put`, or `delete` snippets in a goctl file
- **THEN** the editor inserts a route-oriented snippet with placeholders for handler name, method, path, request type, and response type where applicable

#### Scenario: Inserting annotation and tag helpers
- **WHEN** a user triggers the `@doc`, `@server`, `json`, `path`, or `form` snippets in a goctl file
- **THEN** the editor inserts the matching annotation block or field tag helper

### Requirement: Goctl CLI formatting
The extension SHALL format goctl API documents by invoking the installed `goctl` command-line formatter.

#### Scenario: Formatting succeeds
- **WHEN** a user formats a goctl file and `goctl` is available on `PATH`
- **THEN** the extension runs the goctl formatter and replaces the document contents with the formatted result

#### Scenario: Goctl is missing
- **WHEN** a user formats a goctl file and `goctl` is not available to the extension process
- **THEN** the extension reports a clear formatting error without changing the document contents

#### Scenario: Goctl returns an error
- **WHEN** the goctl formatter exits with a non-zero status
- **THEN** the extension reports the formatter error and preserves the user's unformatted document contents

### Requirement: Definition navigation
The extension SHALL support definition navigation for symbols declared in the active goctl API file and route request/response types declared in directly imported `.api` files where Zed exposes the required extension API.

#### Scenario: Jumping to a type definition
- **WHEN** a route references `CreateUserRequest` and the same file declares `type CreateUserRequest struct`
- **THEN** definition navigation from the route reference moves to the type declaration

#### Scenario: Jumping to a handler declaration
- **WHEN** a route is preceded by `@handler createUser`
- **THEN** definition navigation for `createUser` moves to the handler annotation in the same file

#### Scenario: Jumping to a direct-import request type definition
- **WHEN** `sample.api` imports `types.api`, a route references `CreateUserRequest`, and `types.api` declares `type CreateUserRequest`
- **THEN** definition navigation from the route reference moves to the type declaration in `types.api`

#### Scenario: Unresolved imported type is not claimed
- **WHEN** a route references a type that is not declared in the active file or any directly imported `.api` file
- **THEN** definition navigation does not claim to resolve that symbol

### Requirement: Single-file reference navigation
The extension SHALL support reference navigation for symbols declared or referenced in the active goctl API file where Zed exposes the required extension API.

#### Scenario: Finding type references
- **WHEN** a goctl file declares `type UserResponse struct` and routes reference `UserResponse`
- **THEN** reference navigation includes the declaration and same-file route references

#### Scenario: Finding handler references
- **WHEN** a goctl file contains `@handler createUser`
- **THEN** reference navigation for `createUser` includes the same-file handler occurrence

#### Scenario: References remain file-local
- **WHEN** another `.api` file references the same symbol name
- **THEN** reference navigation for the active file does not include that other file in the first version

### Requirement: User documentation
The extension SHALL document the supported feature set, installation steps, formatter dependency, and first-version limitations.

#### Scenario: Reading setup instructions
- **WHEN** a user reads the repository README
- **THEN** they can identify how to install or load the Zed extension and how to install `goctl` for formatting

#### Scenario: Reading limitation notes
- **WHEN** a user reads the repository README
- **THEN** they can identify that syntax diagnostics, recursive import graph resolution, and cross-file references are not part of the first version
