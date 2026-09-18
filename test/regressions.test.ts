import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

// __dirname at runtime is test-out/test/ (see tsconfig.test.json), so the repo
// root is two levels up.
const ROOT = path.join(__dirname, '..', '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const extensionSrc = fs.readFileSync(path.join(ROOT, 'src', 'extension.ts'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

test('package.json description does not claim to run/package arbitrary Lua scripts', () => {
  assert.doesNotMatch(packageJson.description, /run lua|package lua/i);
});

test('package.json editor/title "when" clause quotes the resourceExtname value', () => {
  const when = packageJson.contributes.menus['editor/title'][0].when;
  assert.equal(when, "resourceExtname == '.lua'");
});

test('README documents that LoveDist only packages LÖVE projects, not standalone Lua scripts', () => {
  assert.match(readme, /does not package standalone Lua scripts/i);
});

test('extension.ts no longer imports/uses the shell-based exec() — only execFile', () => {
  assert.doesNotMatch(extensionSrc, /\bimport\s*\{\s*exec\s*[,}]/);
  // matches a bare `exec(` call but not `execFile(` or `execFileAsync(`
  assert.doesNotMatch(extensionSrc, /(?<!File)(?<!FileAsync)\bexec\(/);
});

test('extension.ts sanitizes gameName and outputDir before using them', () => {
  assert.match(extensionSrc, /sanitizeFileNameSegment\(/);
  assert.match(extensionSrc, /sanitizeOutputDir\(/);
});

test('extension.ts resolves the linux binary via execFile, not a raw shell string', () => {
  assert.match(extensionSrc, /execFileAsync\(which, \[configured\]\)/);
});
