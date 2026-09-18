import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import { sanitizeFileNameSegment, sanitizeOutputDir } from '../src/sanitize';

const PROJECT_ROOT = process.platform === 'win32' ? 'C:\\project' : '/project';

test('sanitizeFileNameSegment: accepts ordinary names', () => {
  assert.equal(sanitizeFileNameSegment('my-game', 'x'), 'my-game');
  assert.equal(sanitizeFileNameSegment('My Game 2', 'x'), 'My Game 2');
  assert.equal(sanitizeFileNameSegment('Jogo do Herói', 'x'), 'Jogo do Herói');
});

test('sanitizeFileNameSegment: rejects empty, ".", ".."', () => {
  assert.throws(() => sanitizeFileNameSegment('', 'lovedist.gameName'));
  assert.throws(() => sanitizeFileNameSegment('.', 'lovedist.gameName'));
  assert.throws(() => sanitizeFileNameSegment('..', 'lovedist.gameName'));
});

test('sanitizeFileNameSegment: rejects path separators (no traversal via gameName)', () => {
  assert.throws(() => sanitizeFileNameSegment('../evil', 'lovedist.gameName'));
  assert.throws(() => sanitizeFileNameSegment('sub/dir', 'lovedist.gameName'));
  assert.throws(() => sanitizeFileNameSegment('sub\\dir', 'lovedist.gameName'));
});

test('sanitizeFileNameSegment: rejects shell/PowerShell injection characters', () => {
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
    assert.throws(
      () => sanitizeFileNameSegment(payload, 'lovedist.gameName'),
      `expected rejection for: ${payload}`
    );
  }
});

test('sanitizeOutputDir: accepts a plain relative dir inside the project', () => {
  assert.equal(sanitizeOutputDir(PROJECT_ROOT, 'dist', 'lovedist.outputDir'), 'dist');
});

test('sanitizeOutputDir: accepts a nested relative dir inside the project', () => {
  assert.equal(sanitizeOutputDir(PROJECT_ROOT, 'build/dist', 'lovedist.outputDir'), 'build/dist');
});

test('sanitizeOutputDir: rejects traversal outside the project root', () => {
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, '../evil', 'lovedist.outputDir'));
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, '../../etc', 'lovedist.outputDir'));
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, 'dist/../../evil', 'lovedist.outputDir'));
});

test('sanitizeOutputDir: rejects an absolute path escaping the project', () => {
  const outside = process.platform === 'win32' ? 'D:\\evil' : '/etc';
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, outside, 'lovedist.outputDir'));
});

test('sanitizeOutputDir: rejects resolving to the project root itself (would rm -rf the whole project)', () => {
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, '.', 'lovedist.outputDir'));
  assert.throws(() => sanitizeOutputDir(PROJECT_ROOT, '', 'lovedist.outputDir'));
});

test('sanitizeOutputDir: rejects shell/PowerShell injection characters', () => {
  const payloads = [
    'dist,evilArg',
    'dist"; rm -rf ~ #',
    'dist`whoami`',
    'dist$(whoami)',
    'dist; touch pwned',
  ];
  for (const payload of payloads) {
    assert.throws(
      () => sanitizeOutputDir(PROJECT_ROOT, payload, 'lovedist.outputDir'),
      `expected rejection for: ${payload}`
    );
  }
});

test('sanitizeOutputDir: returned path is always forward-slash separated', () => {
  const result = sanitizeOutputDir(PROJECT_ROOT, path.join('build', 'dist'), 'lovedist.outputDir');
  assert.ok(!result.includes('\\'));
});
