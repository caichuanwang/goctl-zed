#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const documents = new Map();
const semanticTokenTypes = ["type"];
let buffer = Buffer.alloc(0);
let nextServerRequestId = 1;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    readMessages();
  });
}

function readMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return;
    }

    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const match = /^Content-Length:\s*(\d+)/im.exec(header);
    if (!match) {
      throw new Error("Missing Content-Length header");
    }

    const contentLength = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;
    if (buffer.length < messageEnd) {
      return;
    }

    const body = buffer.subarray(messageStart, messageEnd).toString("utf8");
    buffer = buffer.subarray(messageEnd);
    handleMessage(JSON.parse(body));
  }
}

function send(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function respond(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function respondError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function notify(method, params) {
  send({ jsonrpc: "2.0", method, params });
}

function request(method, params) {
  send({ jsonrpc: "2.0", id: nextServerRequestId++, method, params });
}

function handleMessage(message) {
  if (message.method) {
    handleRequestOrNotification(message);
    return;
  }
}

function handleRequestOrNotification(message) {
  switch (message.method) {
    case "initialize":
      respond(message.id, {
        capabilities: {
          textDocumentSync: 1,
          documentFormattingProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          documentSymbolProvider: true,
          semanticTokensProvider: {
            legend: {
              tokenTypes: semanticTokenTypes,
              tokenModifiers: []
            },
            full: true
          }
        },
        serverInfo: {
          name: "goctl-api-lsp",
          version: readPackageVersion()
        }
      });
      break;
    case "initialized":
      break;
    case "shutdown":
      respond(message.id, null);
      break;
    case "exit":
      process.exit(0);
      break;
    case "textDocument/didOpen":
      documents.set(message.params.textDocument.uri, message.params.textDocument.text);
      break;
    case "textDocument/didChange":
      updateDocument(message.params);
      break;
    case "textDocument/didClose":
      documents.delete(message.params.textDocument.uri);
      break;
    case "textDocument/formatting":
      handleFormatting(message);
      break;
    case "textDocument/documentSymbol":
      handleDocumentSymbols(message);
      break;
    case "textDocument/definition":
      handleDefinition(message);
      break;
    case "textDocument/references":
      handleReferences(message);
      break;
    case "textDocument/semanticTokens/full":
      handleSemanticTokens(message);
      break;
    default:
      if (Object.hasOwn(message, "id")) {
        respond(message.id, null);
      }
  }
}

function updateDocument(params) {
  const uri = params.textDocument.uri;
  const fullTextChange = params.contentChanges.find((change) => typeof change.text === "string" && !change.range);
  if (fullTextChange) {
    documents.set(uri, fullTextChange.text);
    return;
  }

  const current = documents.get(uri) ?? "";
  let lines = current.split("\n");
  for (const change of params.contentChanges) {
    if (!change.range) {
      documents.set(uri, change.text);
      return;
    }
    lines = applyRangeEdit(lines, change.range, change.text);
  }
  documents.set(uri, lines.join("\n"));
}

function applyRangeEdit(lines, range, text) {
  const startLine = lines[range.start.line] ?? "";
  const endLine = lines[range.end.line] ?? "";
  const before = startLine.slice(0, range.start.character);
  const after = endLine.slice(range.end.character);
  const replacement = `${before}${text}${after}`.split("\n");
  return [
    ...lines.slice(0, range.start.line),
    ...replacement,
    ...lines.slice(range.end.line + 1)
  ];
}

function handleFormatting(message) {
  const uri = message.params.textDocument.uri;
  const text = documents.get(uri);
  if (text === undefined) {
    respond(message.id, null);
    return;
  }

  const formatted = formatWithGoctl(text);
  if (!formatted.ok) {
    showError(formatted.error);
    respondError(message.id, -32001, formatted.error);
    return;
  }

  respond(message.id, [{
    range: fullDocumentRange(text),
    newText: formatted.text
  }]);
}

function formatWithGoctl(text, command = process.env.GOCTL_BIN || "goctl") {
  const result = spawnSync(command, ["api", "format", "--stdin"], {
    input: text,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    return {
      ok: false,
      error: `goctl formatter failed to start: ${result.error.message}`
    };
  }

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `exit status ${result.status}`).trim();
    return {
      ok: false,
      error: `goctl formatter failed: ${detail}`
    };
  }

  return {
    ok: true,
    text: result.stdout
  };
}

function handleDocumentSymbols(message) {
  const text = documents.get(message.params.textDocument.uri) ?? "";
  const index = buildSymbolIndex(text);
  respond(message.id, index.declarations.map((symbol) => ({
    name: symbol.name,
    kind: symbolKind(symbol.kind),
    range: symbol.range,
    selectionRange: symbol.selectionRange
  })));
}

function handleDefinition(message) {
  const uri = message.params.textDocument.uri;
  const text = documents.get(uri) ?? "";
  respond(message.id, resolveDefinition(uri, text, message.params.position, documents));
}

function resolveDefinition(uri, text, position, workspaceDocuments = documents) {
  const word = wordAt(text, position);
  if (!word) {
    return null;
  }

  const symbol = findSymbolDefinition(uri, text, word, workspaceDocuments);
  return symbol ? {
    uri: symbol.uri,
    range: symbol.selectionRange
  } : null;
}

function handleReferences(message) {
  const uri = message.params.textDocument.uri;
  const text = documents.get(uri) ?? "";
  const word = wordAt(text, message.params.position);
  if (!word) {
    respond(message.id, []);
    return;
  }

  respond(message.id, findWordReferences(text, word).map((range) => ({ uri, range })));
}

function handleSemanticTokens(message) {
  const uri = message.params.textDocument.uri;
  const text = documents.get(uri) ?? "";
  respond(message.id, semanticTokensForDocument(uri, text, documents));
}

function buildSymbolIndex(text) {
  const declarations = [];
  const lines = text.split("\n");

  for (let line = 0; line < lines.length; line++) {
    const source = stripLineComment(lines[line]);
    collectMatch(declarations, source, line, /\bservice\s+([A-Za-z_][A-Za-z0-9_-]*)\b/g, "service");
    collectMatch(declarations, source, line, /\btype\s+([A-Za-z_][A-Za-z0-9_-]*)\b(?:\s+struct|\s*=|\s*\{|\s+[A-Za-z_*[])/g, "type");
    collectMatch(declarations, source, line, /^\s*([A-Za-z_][A-Za-z0-9_-]*)\s*(?:struct)?\s*\{/g, "type");
    collectMatch(declarations, source, line, /@handler\s+([A-Za-z_][A-Za-z0-9_]*)\b/g, "handler");
    collectMatch(declarations, source, line, /\bhandler\s*:\s*([A-Za-z_][A-Za-z0-9_]*)\b/g, "handler");
  }

  return { declarations: dedupeSymbols(declarations) };
}

function parseImports(text) {
  const imports = [];
  const singleImport = /^\s*import\s+"([^"]+\.api)"\s*$/gm;
  for (const match of text.matchAll(singleImport)) {
    imports.push(match[1]);
  }

  const importGroup = /^\s*import\s*\(([\s\S]*?)\)/gm;
  for (const group of text.matchAll(importGroup)) {
    const quotedPath = /"([^"]+\.api)"/g;
    for (const match of group[1].matchAll(quotedPath)) {
      imports.push(match[1]);
    }
  }

  return [...new Set(imports)];
}

function findSymbolDefinition(uri, text, word, workspaceDocuments = documents) {
  const local = buildSymbolIndex(text).declarations.find((entry) => entry.name === word);
  if (local) {
    return { ...local, uri };
  }

  for (const imported of loadImportedDocuments(uri, text, workspaceDocuments)) {
    const symbol = buildSymbolIndex(imported.text).declarations.find((entry) => entry.name === word);
    if (symbol) {
      return { ...symbol, uri: imported.uri };
    }
  }

  return null;
}

function loadImportedDocuments(uri, text, workspaceDocuments = documents) {
  const imported = [];
  for (const importPath of parseImports(text)) {
    const importUri = resolveImportUri(uri, importPath);
    if (!importUri) {
      continue;
    }

    const importedText = workspaceDocuments.get(importUri) ?? readFileUri(importUri);
    if (importedText !== undefined) {
      imported.push({ uri: importUri, text: importedText });
    }
  }
  return imported;
}

function resolveImportUri(baseUri, importPath) {
  try {
    if (!baseUri.startsWith("file://")) {
      return null;
    }
    const basePath = fileURLToPath(baseUri);
    return pathToFileURL(resolve(dirname(basePath), importPath)).href;
  } catch {
    return null;
  }
}

function readFileUri(uri) {
  try {
    const path = fileURLToPath(uri);
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  } catch {
    return undefined;
  }
}

function semanticTokensForDocument(uri, text, workspaceDocuments = documents) {
  const resolvedTypeNames = new Set(
    [
      ...buildSymbolIndex(text).declarations,
      ...loadImportedDocuments(uri, text, workspaceDocuments).flatMap((entry) => buildSymbolIndex(entry.text).declarations)
    ]
      .filter((symbol) => symbol.kind === "type")
      .map((symbol) => symbol.name)
  );

  const tokens = [];
  const lines = text.split("\n");
  for (let line = 0; line < lines.length; line++) {
    const source = stripLineComment(lines[line]);
    for (const token of routeTypeReferences(source, line)) {
      if (resolvedTypeNames.has(token.name)) {
        tokens.push(token);
      }
    }
  }

  return { data: encodeSemanticTokens(tokens) };
}

function routeTypeReferences(source, line) {
  if (!/\b(?:get|post|put|delete|patch|head|options)\b/.test(source)) {
    return [];
  }

  const tokens = [];
  for (const match of source.matchAll(/\(([^()]+)\)|\breturns\s*\(([^()]+)\)/g)) {
    const name = (match[2] ?? match[1]).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      continue;
    }

    const groupIndex = match[2] === undefined ? 1 : 2;
    const character = match.index + match[0].indexOf(match[groupIndex]);
    tokens.push({ line, character, length: name.length, name });
  }
  return tokens;
}

function encodeSemanticTokens(tokens) {
  const data = [];
  let previousLine = 0;
  let previousCharacter = 0;
  for (const token of tokens.sort((left, right) => left.line - right.line || left.character - right.character)) {
    const deltaLine = token.line - previousLine;
    const deltaStart = deltaLine === 0 ? token.character - previousCharacter : token.character;
    data.push(deltaLine, deltaStart, token.length, 0, 0);
    previousLine = token.line;
    previousCharacter = token.character;
  }
  return data;
}

function collectMatch(declarations, source, line, regex, kind) {
  for (const match of source.matchAll(regex)) {
    const name = match[1];
    const character = match.index + match[0].indexOf(name);
    declarations.push({
      name,
      kind,
      range: lineRange(line, source.length),
      selectionRange: tokenRange(line, character, name.length)
    });
  }
}

function dedupeSymbols(symbols) {
  const seen = new Set();
  const result = [];
  for (const symbol of symbols) {
    const key = `${symbol.kind}:${symbol.name}:${symbol.selectionRange.start.line}:${symbol.selectionRange.start.character}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(symbol);
    }
  }
  return result;
}

function findWordReferences(text, word) {
  const ranges = [];
  const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "g");
  const lines = text.split("\n");
  for (let line = 0; line < lines.length; line++) {
    const source = stripLineComment(lines[line]);
    for (const match of source.matchAll(regex)) {
      ranges.push(tokenRange(line, match.index, word.length));
    }
  }
  return ranges;
}

function wordAt(text, position) {
  const line = text.split("\n")[position.line] ?? "";
  let cursor = Math.min(position.character, line.length);
  if (cursor > 0 && !/[A-Za-z0-9_-]/.test(line[cursor]) && /[A-Za-z0-9_-]/.test(line[cursor - 1])) {
    cursor--;
  }

  let start = cursor;
  let end = start;
  while (start > 0 && /[A-Za-z0-9_-]/.test(line[start - 1])) {
    start--;
  }
  while (end < line.length && /[A-Za-z0-9_-]/.test(line[end])) {
    end++;
  }
  return start === end ? "" : line.slice(start, end);
}

function stripLineComment(line) {
  const index = line.indexOf("//");
  return index === -1 ? line : line.slice(0, index);
}

function fullDocumentRange(text) {
  const lines = text.split("\n");
  const lastLine = Math.max(lines.length - 1, 0);
  return {
    start: { line: 0, character: 0 },
    end: { line: lastLine, character: lines[lastLine].length }
  };
}

function lineRange(line, length) {
  return {
    start: { line, character: 0 },
    end: { line, character: length }
  };
}

function tokenRange(line, character, length) {
  return {
    start: { line, character },
    end: { line, character: character + length }
  };
}

function symbolKind(kind) {
  switch (kind) {
    case "service":
      return 5;
    case "handler":
      return 12;
    case "type":
    default:
      return 23;
  }
}

function showError(message) {
  request("window/showMessage", {
    type: 1,
    message
  });
}

function readPackageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    return packageJson.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export {
  buildSymbolIndex,
  findWordReferences,
  formatWithGoctl,
  fullDocumentRange,
  parseImports,
  resolveDefinition,
  semanticTokensForDocument,
  wordAt
};
