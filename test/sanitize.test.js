"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = require("node:assert/strict");
const path = require("path");
const sanitize_1 = require("../src/sanitize");
const PROJECT_ROOT = process.platform === 'win32' ? 'C:\\project' : '/project';
(0, node_test_1.test)('sanitizeFileNameSegment: accepts ordinary names', () => {
    strict_1.default.equal((0, sanitize_1.sanitizeFileNameSegment)('my-game', 'x'), 'my-game');
    strict_1.default.equal((0, sanitize_1.sanitizeFileNameSegment)('My Game 2', 'x'), 'My Game 2');
    strict_1.default.equal((0, sanitize_1.sanitizeFileNameSegment)('Jogo do Herói', 'x'), 'Jogo do Herói');
});
(0, node_test_1.test)('sanitizeFileNameSegment: rejects empty, ".", ".."', () => {
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('', 'lovedist.gameName'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('.', 'lovedist.gameName'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('..', 'lovedist.gameName'));
});
(0, node_test_1.test)('sanitizeFileNameSegment: rejects path separators (no traversal via gameName)', () => {
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('../evil', 'lovedist.gameName'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('sub/dir', 'lovedist.gameName'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)('sub\\dir', 'lovedist.gameName'));
});
(0, node_test_1.test)('sanitizeFileNameSegment: rejects shell/PowerShell injection characters', () => {
    const payloads = [
        'game"; rm -rf ~ #',
        "game' ; touch pwned ; '",
        'game`whoami`',
        'game$(whoami)',
        'game; touch pwned',
        'game | cat /etc/passwd',
        'game & calc.exe',
        'game > /etc/passwd',
        'game (evil)',
        'game {evil}',
    ];
    for (const payload of payloads) {
        strict_1.default.throws(() => (0, sanitize_1.sanitizeFileNameSegment)(payload, 'lovedist.gameName'), `expected rejection for: ${payload}`);
    }
});
(0, node_test_1.test)('sanitizeOutputDir: accepts a plain relative dir inside the project', () => {
    strict_1.default.equal((0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, 'dist', 'lovedist.outputDir'), 'dist');
});
(0, node_test_1.test)('sanitizeOutputDir: accepts a nested relative dir inside the project', () => {
    strict_1.default.equal((0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, 'build/dist', 'lovedist.outputDir'), 'build/dist');
});
(0, node_test_1.test)('sanitizeOutputDir: rejects traversal outside the project root', () => {
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, '../evil', 'lovedist.outputDir'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, '../../etc', 'lovedist.outputDir'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, 'dist/../../evil', 'lovedist.outputDir'));
});
(0, node_test_1.test)('sanitizeOutputDir: rejects an absolute path escaping the project', () => {
    const outside = process.platform === 'win32' ? 'D:\\evil' : '/etc';
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, outside, 'lovedist.outputDir'));
});
(0, node_test_1.test)('sanitizeOutputDir: rejects resolving to the project root itself (would rm -rf the whole project)', () => {
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, '.', 'lovedist.outputDir'));
    strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, '', 'lovedist.outputDir'));
});
(0, node_test_1.test)('sanitizeOutputDir: rejects shell/PowerShell injection characters', () => {
    const payloads = [
        'dist,evilArg',
        'dist"; rm -rf ~ #',
        'dist`whoami`',
        'dist$(whoami)',
        'dist; touch pwned',
    ];
    for (const payload of payloads) {
        strict_1.default.throws(() => (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, payload, 'lovedist.outputDir'), `expected rejection for: ${payload}`);
    }
});
(0, node_test_1.test)('sanitizeOutputDir: returned path is always forward-slash separated', () => {
    const result = (0, sanitize_1.sanitizeOutputDir)(PROJECT_ROOT, path.join('build', 'dist'), 'lovedist.outputDir');
    strict_1.default.ok(!result.includes('\\'));
});
//# sourceMappingURL=sanitize.test.js.map