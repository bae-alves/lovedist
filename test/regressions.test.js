"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
// __dirname at runtime is test-out/test/ (see tsconfig.test.json), so the repo
// root is two levels up.
const ROOT = path.join(__dirname, '..', '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const extensionSrc = fs.readFileSync(path.join(ROOT, 'src', 'extension.ts'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
(0, node_test_1.test)('package.json description does not claim to run/package arbitrary Lua scripts', () => {
    strict_1.default.doesNotMatch(packageJson.description, /run lua|package lua/i);
});
(0, node_test_1.test)('package.json editor/title "when" clause quotes the resourceExtname value', () => {
    const when = packageJson.contributes.menus['editor/title'][0].when;
    strict_1.default.equal(when, "resourceExtname == '.lua'");
});
(0, node_test_1.test)('README documents that LoveDist only packages LÖVE projects, not standalone Lua scripts', () => {
    strict_1.default.match(readme, /does not package standalone Lua scripts/i);
});
(0, node_test_1.test)('extension.ts no longer imports/uses the shell-based exec() — only execFile', () => {
    strict_1.default.doesNotMatch(extensionSrc, /\bimport\s*\{\s*exec\s*[,}]/);
    // matches a bare `exec(` call but not `execFile(` or `execFileAsync(`
    strict_1.default.doesNotMatch(extensionSrc, /(?<!File)(?<!FileAsync)\bexec\(/);
});
(0, node_test_1.test)('extension.ts sanitizes gameName and outputDir before using them', () => {
    strict_1.default.match(extensionSrc, /sanitizeFileNameSegment\(/);
    strict_1.default.match(extensionSrc, /sanitizeOutputDir\(/);
});
(0, node_test_1.test)('extension.ts resolves the linux binary via execFile, not a raw shell string', () => {
    strict_1.default.match(extensionSrc, /execFileAsync\(which, \[configured\]\)/);
});
//# sourceMappingURL=regressions.test.js.map