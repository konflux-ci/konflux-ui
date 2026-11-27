import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const compareScript = join(scriptsDir, 'compare-bundle-delta.mjs');
const formatScript = join(scriptsDir, 'format-size-limit-comment.mjs');

/** @param {string} script @param {string[]} args */
function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

/** @param {unknown} value */
function writeJson(dir, name, value) {
  const path = join(dir, name);
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value)}\n`);
  return path;
}

/** @param {string} name @param {number} size */
function check(name, size) {
  return { name, size, passed: true, sizeLimit: 100000 };
}

test('2048 bytes of total growth passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const base = writeJson(dir, 'base.json', [check('main', 1000)]);
  const pr = writeJson(dir, 'pr.json', [check('main', 3048)]);
  const result = run(compareScript, [base, pr, '--max-bytes', '2048']);
  assert.equal(result.status, 0, result.stderr);
});

test('2049 bytes of total growth fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const base = writeJson(dir, 'base.json', [check('main', 1000)]);
  const pr = writeJson(dir, 'pr.json', [check('main', 3049)]);
  const result = run(compareScript, [base, pr, '--max-bytes', '2048']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /exceeds max/);
  assert.doesNotMatch(result.stderr, /exceeds max/);
  assert.match(
    result.stdout,
    /Bundle gzip size limit[\s\S]*\nFailed\ntotal growth [^\n]+exceeds max[^\n]*\n?$/,
  );
});

test('a chunk missing from one output fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const base = writeJson(dir, 'base.json', [check('main', 1000)]);
  const pr = writeJson(dir, 'pr.json', [check('main', 1000), check('vendor', 1000)]);
  const config = writeJson(dir, 'config.json', [
    { name: 'main', path: 'dist/main.*.js', limit: '10 kB' },
    { name: 'vendor', path: 'dist/vendor.*.js', limit: '10 kB' },
  ]);
  const result = run(compareScript, [base, pr, '--config', config, '--max-bytes', '2048']);
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /cannot compute total/);
});

test('a removed expected check fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const sizes = [check('main', 1000), check('vendor', 1000)];
  const baseSizes = writeJson(dir, 'base.json', sizes);
  const prSizes = writeJson(dir, 'pr.json', sizes);
  const baseConfig = writeJson(dir, 'base-config.json', [
    { name: 'main', path: 'dist/main.*.js', limit: '10 kB' },
    { name: 'vendor', path: 'dist/vendor.*.js', limit: '10 kB' },
  ]);
  const prConfig = writeJson(dir, 'pr-config.json', [
    { name: 'main', path: 'dist/main.*.js', limit: '10 kB' },
  ]);
  const compareConfig = writeJson(dir, 'compare.json', [
    { name: 'main', path: 'dist/main.*.js', limit: '10 kB' },
    { name: 'vendor', path: 'dist/vendor.*.js', limit: '10 kB' },
  ]);
  const result = run(compareScript, [
    baseSizes,
    prSizes,
    '--config',
    compareConfig,
    '--base-config',
    baseConfig,
    '--pr-config',
    prConfig,
    '--max-bytes',
    '2048',
  ]);
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /removed or renamed/);
});

test('duplicate names fail', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const checks = [check('main', 1000), check('main', 1000)];
  const base = writeJson(dir, 'base.json', checks);
  const pr = writeJson(dir, 'pr.json', checks);
  const result = run(compareScript, [base, pr, '--max-bytes', '2048']);
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /duplicated/);
});

test('malformed JSON fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const base = writeJson(dir, 'base.json', '{');
  const pr = writeJson(dir, 'pr.json', [check('main', 1000)]);
  const result = run(compareScript, [base, pr]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Failed to parse/);
});

test('an invalid size-limit entry fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const base = writeJson(dir, 'base.json', [{ name: 'main' }]);
  const pr = writeJson(dir, 'pr.json', [check('main', 1000)]);
  const result = run(compareScript, [base, pr]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /numeric size/);
});

test('formatter describes growth that exceeded the limit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const report = writeJson(dir, 'report.json', {
    maxBytes: 2048,
    passed: false,
    overall: { baseSize: 1000, prSize: 4000, delta: 3000, passed: false },
    chunks: [{ name: 'main', baseSize: 1000, prSize: 4000, delta: 3000, sizeLimit: 282000 }],
    configFailures: [],
    absoluteFailures: [],
  });
  const result = run(formatScript, [report]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /### Bundle size growth limit exceeded/);
  assert.match(result.stdout, /Per-chunk ceilings/);
  assert.match(result.stdout, /282 kB/);
  assert.match(result.stdout, /Per-chunk breakdown/);
  assert.match(result.stdout, /Shrink the change/);
  assert.doesNotMatch(result.stdout, /comparison incomplete/);
});

test('formatter describes an incomplete comparison', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-size-'));
  const report = writeJson(dir, 'report.json', {
    maxBytes: 2048,
    passed: false,
    overall: {
      baseSize: 0,
      prSize: 0,
      delta: 0,
      passed: false,
      reason: 'cannot compute total: 1 chunk(s) missing from base or PR output',
    },
    chunks: [
      { name: 'main', baseSize: 1000, prSize: 1000, delta: 0 },
      { name: 'vendor', baseSize: null, prSize: 2000, delta: null, reason: 'missing on base' },
    ],
    configFailures: [],
  });
  const result = run(formatScript, [report]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /### Bundle size comparison incomplete/);
  assert.match(result.stdout, /Totals cannot be computed/);
  assert.match(result.stdout, /vendor/);
  assert.match(result.stdout, /missing on base/);
  assert.doesNotMatch(result.stdout, /Shrink the change/);
  assert.doesNotMatch(result.stdout, /growth limit exceeded/);
});
