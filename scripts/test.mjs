import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildSymbolIndex,
  findWordReferences,
  formatWithGoctl,
  fullDocumentRange,
  parseImports,
  resolveDefinition,
  semanticTokensForDocument,
  wordAt
} from "../server/goctl-api-lsp.mjs";

const sample = readFileSync(new URL("../fixtures/sample.api", import.meta.url), "utf8");
const types = readFileSync(new URL("../fixtures/types.api", import.meta.url), "utf8");
const sampleUri = new URL("../fixtures/sample.api", import.meta.url).href;
const typesUri = new URL("../fixtures/types.api", import.meta.url).href;

test("extension manifest references expected language assets", () => {
  const manifest = readFileSync(new URL("../extension.toml", import.meta.url), "utf8");
  assert.match(manifest, /id = "goctl"/);
  assert.match(manifest, /snippets = \["\.\/snippets\/goctl\.json"\]/);
  assert.match(manifest, /\[grammars\.goctl\]/);
  assert.match(manifest, /\[language_servers\.goctl-api-lsp\]/);

  const config = readFileSync(new URL("../languages/goctl/config.toml", import.meta.url), "utf8");
  assert.match(config, /name = "goctl"/);
  assert.match(config, /grammar = "goctl"/);
  assert.match(config, /path_suffixes = \["api"\]/);
});

test("snippets include goctl-vscode parity triggers", () => {
  const snippets = JSON.parse(readFileSync(new URL("../snippets/goctl.json", import.meta.url), "utf8"));
  const prefixes = Object.values(snippets).map((snippet) => snippet.prefix);
  for (const prefix of [
    "im",
    "tys",
    "info",
    "service",
    "type",
    "handler",
    "json",
    "path",
    "form",
    "@doc",
    "@server",
    "@handler",
    "post",
    "get",
    "delete",
    "put"
  ]) {
    assert.ok(prefixes.includes(prefix), `missing snippet prefix ${prefix}`);
  }
});

test("symbol index captures same-file declarations", () => {
  const sampleNames = buildSymbolIndex(sample).declarations.map((symbol) => symbol.name);
  assert.ok(sampleNames.includes("user-api"));
  assert.ok(sampleNames.includes("createUser"));
  assert.ok(sampleNames.includes("getUser"));

  const typeNames = buildSymbolIndex(types).declarations.map((symbol) => symbol.name);
  assert.ok(typeNames.includes("CreateUserRequest"));
  assert.ok(typeNames.includes("UserResponse"));
});

test("imports are parsed from api files", () => {
  assert.deepEqual(parseImports(sample), ["types.api"]);
});

test("definition resolves request and response types through direct imports", () => {
  const workspaceDocuments = new Map([[sampleUri, sample], [typesUri, types]]);

  assert.deepEqual(resolveDefinition(sampleUri, sample, { line: 22, character: 28 }, workspaceDocuments), {
    uri: typesUri,
    range: {
      start: { line: 2, character: 5 },
      end: { line: 2, character: 22 }
    }
  });

  assert.deepEqual(resolveDefinition(sampleUri, sample, { line: 22, character: 50 }, workspaceDocuments), {
    uri: typesUri,
    range: {
      start: { line: 8, character: 5 },
      end: { line: 8, character: 17 }
    }
  });
});

test("semantic tokens only highlight route types with resolved declarations", () => {
  const workspaceDocuments = new Map([[sampleUri, sample], [typesUri, types]]);
  const tokens = semanticTokensForDocument(sampleUri, sample, workspaceDocuments);
  assert.deepEqual(tokens, {
    data: [
      22, 18, 17, 0, 0,
      0, 28, 12, 0, 0,
      6, 25, 12, 0, 0
    ]
  });
});

test("semantic tokens omit unresolved route types", () => {
  const unresolved = sample.replace("CreateUserRequest", "MissingRequest");
  const workspaceDocuments = new Map([[sampleUri, unresolved], [typesUri, types]]);
  const tokens = semanticTokensForDocument(sampleUri, unresolved, workspaceDocuments);
  assert.deepEqual(tokens, {
    data: [
      22, 43, 12, 0, 0,
      6, 25, 12, 0, 0
    ]
  });
});

test("word references are file-local text ranges", () => {
  const references = findWordReferences(sample, "UserResponse");
  assert.equal(references.length, 2);
  assert.deepEqual(references[0].start, { line: 22, character: 46 });
});

test("wordAt returns goctl identifiers around cursor", () => {
  const position = { line: 22, character: 28 };
  assert.equal(wordAt(sample, position), "CreateUserRequest");
});

test("wordAt tolerates cursor at the end boundary of a type identifier", () => {
  const position = { line: 22, character: 35 };
  assert.equal(wordAt(sample, position), "CreateUserRequest");
});

test("local api fixture keeps same-file navigation coverage", () => {
  const local = `syntax = "v1"

type CreateUserRequest {
  Name string
}

type UserResponse {
  Id string
}

service user-api {
  @handler createUser
  post /users (CreateUserRequest) returns (UserResponse)
}
`;
  const names = buildSymbolIndex(local).declarations.map((symbol) => symbol.name);
  assert.ok(names.includes("user-api"));
  assert.ok(names.includes("CreateUserRequest"));
  assert.ok(names.includes("UserResponse"));
  assert.ok(names.includes("createUser"));
});

test("formatWithGoctl preserves document when formatter cannot start", () => {
  const result = formatWithGoctl(sample, "__missing_goctl_binary__");
  assert.equal(result.ok, false);
  assert.match(result.error, /failed to start/);
});

test("fullDocumentRange spans the entire document", () => {
  assert.deepEqual(fullDocumentRange("a\nbc"), {
    start: { line: 0, character: 0 },
    end: { line: 1, character: 2 }
  });
});
