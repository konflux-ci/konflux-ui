#!/usr/bin/env node
/**
 * Fetches the Konflux UI analytics schema from segment-bridge and generates
 * TypeScript type definitions into a single file using json-schema-to-typescript.
 *
 * Usage: node scripts/generate-analytics-types.mjs
 */

import { compile } from 'json-schema-to-typescript';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Pinned commit hash for stable schema reference. Update this when adopting new schema changes.
const SCHEMA_COMMIT = 'main'; // TODO: replace with merge commit hash once segment-bridge PR is merged
const SCHEMA_URL = `https://raw.githubusercontent.com/konflux-ci/segment-bridge/${SCHEMA_COMMIT}/schema/ui.json`;

const LOCAL_SCHEMA_PATH = join(
  import.meta.dirname,
  '..',
  '..',
  'segment-bridge',
  'schema',
  'ui.json',
);

const OUTPUT_DIR = join(import.meta.dirname, '..', 'src', 'analytics', 'gen');
const OUTPUT_FILE = join(OUTPUT_DIR, 'analytics-types.ts');

const HEADER = `/**
 * ⚠️  AUTO-GENERATED FILE — DO NOT EDIT MANUALLY ⚠️
 *
 * This file was generated from the Konflux analytics schema.
 * Schema: https://github.com/konflux-ci/segment-bridge/blob/${SCHEMA_COMMIT}/schema/ui.json
 * Docs:   docs/analytics.md
 *
 * To regenerate, run: yarn generate:analytics-types
 *
 * LLM INSTRUCTIONS: If asked to modify analytics types, always regenerate
 * from schema instead of editing this file directly.
 */`;

async function fetchSchema() {
  try {
    const res = await fetch(SCHEMA_URL);
    if (res.ok) return res.json();
  } catch {
    // Fall through to local file
  }

  if (existsSync(LOCAL_SCHEMA_PATH)) {
    console.log('  Remote fetch failed, using local schema:', LOCAL_SCHEMA_PATH);
    return JSON.parse(await readFile(LOCAL_SCHEMA_PATH, 'utf-8'));
  }

  throw new Error(
    `Failed to fetch schema from ${SCHEMA_URL} and no local fallback found at ${LOCAL_SCHEMA_PATH}`,
  );
}

async function main() {
  console.log('Fetching schema from:', SCHEMA_URL);
  const schema = await fetchSchema();

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const ts = await compile(schema, 'KonfluxUISegmentEvents', {
    bannerComment: HEADER,
    additionalProperties: false,
  });

  // SHA256Hash branded type — referenced by tsType in the schema
  const sha256Type =
    '/** Branded type for SHA-256 obfuscated strings. Use `obfuscate()` to create. */\n' +
    "export type SHA256Hash = string & { readonly __brand: 'SHA256Hash' };\n\n";

  // Collect event defs that have x-event-name
  const defs = schema.$defs || {};
  const eventDefs = Object.entries(defs).filter(([, def]) => def['x-event-name']);

  const toPascalCase = (s) =>
    s
      .split('_')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('');

  // Generate TrackEvents enum from x-event-name fields in $defs
  const enumEntries = eventDefs.map(([key, def]) => `  ${key} = '${def['x-event-name']}',`);

  const enumBlock = [
    '',
    '/**',
    ' * Event names for Segment track() calls.',
    ' * Values match the x-event-name field in the schema.',
    ' */',
    'export enum TrackEvents {',
    ...enumEntries,
    '}',
    '',
  ].join('\n');

  // Generate EventPropertiesMap — maps each TrackEvents value to its event-specific
  // properties with CommonFields excluded (they are merged via commonProperties).
  const mapEntries = eventDefs.map(
    ([key]) => `  [TrackEvents.${key}]: Omit<${toPascalCase(key)}, keyof CommonFields>;`,
  );

  const mapBlock = [
    '',
    '/**',
    ' * Maps each TrackEvents value to the event-specific properties callers must supply.',
    ' * CommonFields are excluded — they are merged automatically from commonProperties.',
    ' */',
    'export type EventPropertiesMap = {',
    ...mapEntries,
    '};',
    '',
  ].join('\n');

  await writeFile(OUTPUT_FILE, ts + sha256Type + enumBlock + mapBlock);
  console.log('  Generated: analytics-types.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
