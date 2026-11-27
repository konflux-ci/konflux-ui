#!/usr/bin/env node
/**
 * Builds the size-limit config used for both the base and PR measurements.
 * Path patterns for the same check name are the union of the base and PR configs.
 * A limit set on the PR is kept; otherwise the base limit is kept.
 *
 * Usage:
 *   node merge-size-limit-config.mjs <base.json> <pr.json> <output.json>
 */

import { readFileSync, writeFileSync } from 'node:fs';

const [basePath, prPath, outputPath] = process.argv.slice(2);
if (!basePath || !prPath || !outputPath) {
  console.error('Usage: node merge-size-limit-config.mjs <base.json> <pr.json> <output.json>');
  process.exit(2);
}

/** @param {string} filePath */
function readConfig(filePath) {
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error instanceof Error ? error.message : error);
    process.exit(2);
  }
  if (!Array.isArray(data)) {
    console.error(`${filePath}: expected a JSON array`);
    process.exit(2);
  }
  return data;
}

/**
 * @param {unknown[]} entries
 * @param {string} label
 * @returns {Map<string, { name: string; path: string | string[]; limit?: string; gzip?: boolean }>}
 */
function indexByName(entries, label) {
  /** @type {Map<string, { name: string; path: string | string[]; limit?: string; gzip?: boolean }>} */
  const map = new Map();
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      entry.name === ''
    ) {
      console.error(`${label}: each check needs a name`);
      process.exit(1);
    }
    if (map.has(entry.name)) {
      console.error(`${label}: duplicate check "${entry.name}"`);
      process.exit(1);
    }
    map.set(entry.name, entry);
  }
  return map;
}

/** @param {{ name: string; path?: unknown }} entry @param {string} label */
function pathsOf(entry, label) {
  const { path } = entry;
  const list = typeof path === 'string' ? [path] : Array.isArray(path) ? path : null;
  if (!list || list.some((item) => typeof item !== 'string' || item === '')) {
    console.error(`${label}: check "${entry.name}" needs a path`);
    process.exit(1);
  }
  return list;
}

/** @param {string[]} paths */
function uniquePaths(paths) {
  return [...new Set(paths)];
}

/** @param {{ limit?: unknown }} entry */
function limitOf(entry) {
  return typeof entry.limit === 'string' && entry.limit.trim() !== '' ? entry.limit : undefined;
}

const baseByName = indexByName(readConfig(basePath), 'base .size-limit.json');
const prByName = indexByName(readConfig(prPath), 'PR .size-limit.json');
const names = [...new Set([...baseByName.keys(), ...prByName.keys()])];

const merged = names.map((name) => {
  const baseEntry = baseByName.get(name);
  const prEntry = prByName.get(name);
  const paths = uniquePaths([
    ...(baseEntry ? pathsOf(baseEntry, 'base .size-limit.json') : []),
    ...(prEntry ? pathsOf(prEntry, 'PR .size-limit.json') : []),
  ]);
  const limit = (prEntry && limitOf(prEntry)) || (baseEntry && limitOf(baseEntry));
  if (!limit) {
    console.error(`check "${name}" has no limit in the base or PR config`);
    process.exit(1);
  }
  const gzip = baseEntry?.gzip ?? prEntry?.gzip;
  return {
    name,
    path: paths.length === 1 ? paths[0] : paths,
    limit,
    ...(typeof gzip === 'boolean' ? { gzip } : {}),
  };
});

writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`);
