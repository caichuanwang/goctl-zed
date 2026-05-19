#!/usr/bin/env node

import assert from "node:assert/strict";
import { accessSync, constants, readFileSync, statSync } from "node:fs";
const manifest = readFileSync(new URL("../../extension.toml", import.meta.url), "utf8");
assert.match(manifest, /^id = "goctl"$/m);
assert.match(manifest, /^version = "0\.1\.0"$/m);
assert.match(manifest, /^repository = "https:\/\/github\.com\/caichuanwang\/goctl-zed"$/m);
assert.match(manifest, /\[language_servers\.goctl-api-lsp\]/);
assert.match(manifest, /\[grammars\.goctl\]/);

accessSync(new URL("../../LICENSE", import.meta.url), constants.R_OK);
accessSync(new URL("../../grammars/goctl.wasm", import.meta.url), constants.R_OK);
accessSync(new URL("../../server/goctl-api-lsp.mjs", import.meta.url), constants.R_OK | constants.X_OK);
assert.ok(statSync(new URL("../../server/goctl-api-lsp.mjs", import.meta.url)).size > 0);

const rust = readFileSync(new URL("../../src/lib.rs", import.meta.url), "utf8");
assert.match(rust, /worktree\.which\(SERVER_BINARY\)/);
assert.match(rust, /latest_github_release\(/);
assert.match(rust, /LOCAL_DEVELOPMENT_SERVER_PATH/);
assert.doesNotMatch(rust, /join\("server"\)/);

console.log("Release readiness checks passed.");
