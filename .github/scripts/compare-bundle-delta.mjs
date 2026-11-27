#!/usr/bin/env node
/**
 * Compares size-limit --json output from base and PR builds.
 * Fails when a check is missing, removed, renamed, or duplicated, when a PR chunk
 * exceeds its absolute ceiling, or when total gzip growth exceeds --max-bytes (default 2048).
 *
 * Usage:
 *   node compare-bundle-delta.mjs base.json pr.json [--config compare.json] [--base-config base.json] [--pr-config pr.json] [--max-bytes 2048] [--output report.json]
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_MAX_BYTES = 2048;

/** @param {string[]} argv */
function parseArgs(argv) {
  const positional = [];
  let maxBytes = DEFAULT_MAX_BYTES;
  let outputPath;
  let configPath;
  let baseConfigPath;
  let prConfigPath;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--max-bytes') {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 0) {
        console.error('--max-bytes must be a non-negative number');
        process.exit(2);
      }
      maxBytes = value;
    } else if (arg === '--output') {
      outputPath = readOptionValue(arg, argv[++i]);
    } else if (arg === '--config') {
      configPath = readOptionValue(arg, argv[++i]);
    } else if (arg === '--base-config') {
      baseConfigPath = readOptionValue(arg, argv[++i]);
    } else if (arg === '--pr-config') {
      prConfigPath = readOptionValue(arg, argv[++i]);
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2) {
    console.error(
      'Usage: node compare-bundle-delta.mjs <base.json> <pr.json> [--config compare.json] [--base-config base.json] [--pr-config pr.json] [--max-bytes 2048] [--output report.json]',
    );
    process.exit(2);
  }

  return {
    basePath: positional[0],
    prPath: positional[1],
    maxBytes,
    outputPath,
    configPath,
    baseConfigPath,
    prConfigPath,
  };
}

/** @param {string} flag @param {string | undefined} value */
function readOptionValue(flag, value) {
  if (!value || value.startsWith('-')) {
    console.error(`${flag} requires a file path`);
    process.exit(2);
  }
  return value;
}

/** @param {string} filePath */
function readSizeLimitJson(filePath) {
  const raw = readFileSync(filePath, 'utf8').trim();
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('expected JSON array');
    }
    return data;
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error instanceof Error ? error.message : error);
    process.exit(2);
  }
}

/** @param {{ name?: string; size?: number; passed?: boolean; sizeLimit?: number }[]} checks */
function checksByName(checks) {
  /** @type {Map<string, { name?: string; size: number; passed?: boolean; sizeLimit?: number }>} */
  const map = new Map();
  /** @type {string[]} */
  const duplicates = [];
  for (const check of checks) {
    if (!check.name || typeof check.size !== 'number') {
      console.error('Invalid size-limit entry: each item must have a name and numeric size');
      process.exit(2);
    }
    if (map.has(check.name)) duplicates.push(check.name);
    map.set(check.name, check);
  }
  return { map, duplicates };
}

/** @param {string} filePath */
function readNamedConfig(filePath) {
  const entries = readSizeLimitJson(filePath);
  /** @type {Map<string, { name?: string }>} */
  const map = new Map();
  /** @type {string[]} */
  const duplicates = [];
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string' || entry.name === '') {
      console.error(`${filePath}: each check needs a name`);
      process.exit(2);
    }
    if (map.has(entry.name)) duplicates.push(entry.name);
    map.set(entry.name, entry);
  }
  return { map, duplicates };
}

/** Gzip sizes use decimal kB (1000 B = 1 kB), matching size-limit output. */
/** @param {number} bytes */
function formatKb(bytes) {
  const kb = bytes / 1000;
  if (Math.abs(kb - Math.round(kb)) < 0.005) {
    return `${Math.round(kb)} kb`;
  }
  return `${Math.round(kb * 100) / 100} kb`;
}

/** @param {number} deltaBytes */
function formatDeltaParenthetical(deltaBytes) {
  const sign = deltaBytes >= 0 ? '+' : '-';
  const kb = Math.abs(deltaBytes) / 1000;
  const rounded =
    Math.abs(kb - Math.round(kb)) < 0.005
      ? String(Math.round(kb))
      : String(Math.round(kb * 100) / 100);
  return `(${sign}${rounded}kb)`;
}

/** @param {number} maxBytes */
function formatMaxGrowth(maxBytes) {
  if (maxBytes === DEFAULT_MAX_BYTES) {
    return '2 kb';
  }
  return formatKb(maxBytes);
}

/** @typedef {{ name: string; baseSize: number | null; prSize: number | null; delta: number | null; reason?: string }} ChunkResult */

/** @typedef {{ baseSize: number; prSize: number; delta: number; passed: boolean; reason?: string }} OverallResult */

/** @param {ChunkResult[]} chunks */
function computeOverall(chunks) {
  const missing = chunks.filter((chunk) => chunk.delta === null);
  if (missing.length > 0) {
    return {
      baseSize: 0,
      prSize: 0,
      delta: 0,
      passed: false,
      reason: `cannot compute total: ${missing.length} chunk(s) missing from base or PR output`,
    };
  }

  let baseSize = 0;
  let prSize = 0;
  for (const chunk of chunks) {
    baseSize += chunk.baseSize ?? 0;
    prSize += chunk.prSize ?? 0;
  }

  return {
    baseSize,
    prSize,
    delta: prSize - baseSize,
    passed: true,
  };
}

/** GitHub Actions job logs drop empty lines; zero-width space preserves visual gaps. */
function ciLogGapLine() {
  return process.env.GITHUB_ACTIONS ? '\u200b' : '';
}

/** @param {{ name: string; reason: string }[]} configFailures @param {{ name: string; size: number; sizeLimit: number | null }[]} absoluteFailures */
function formatFailureLines(configFailures, absoluteFailures) {
  const lines = [];
  if (configFailures.length > 0) {
    lines.push(ciLogGapLine(), 'config');
    for (const failure of configFailures) {
      lines.push(`${failure.name}: ${failure.reason}`);
    }
  }
  if (absoluteFailures.length > 0) {
    lines.push(ciLogGapLine(), 'absolute ceiling');
    for (const failure of absoluteFailures) {
      const limit = failure.sizeLimit == null ? '—' : formatKb(failure.sizeLimit);
      lines.push(`${failure.name}: ${formatKb(failure.size)} > ${limit}`);
    }
  }
  return lines;
}

/** @param {ChunkResult[]} chunks @param {OverallResult} overall @param {number} maxBytes @param {{ name: string; reason: string }[]} configFailures @param {{ name: string; size: number; sizeLimit: number | null }[]} absoluteFailures */
function formatCiReport(chunks, overall, maxBytes, configFailures, absoluteFailures) {
  const lines = [
    'Bundle gzip comparison (vs PR base branch)',
    `Max allowed total growth (all chunks): ${formatMaxGrowth(maxBytes)}`,
    ciLogGapLine(),
  ];

  for (const chunk of chunks) {
    lines.push(chunk.name);
    if (chunk.delta === null) {
      lines.push('Base branch : —');
      lines.push(`This branch : — ${chunk.reason ?? ''}`.trimEnd());
    } else {
      lines.push(`Base branch : ${formatKb(chunk.baseSize)}`);
      lines.push(
        `This branch : ${formatKb(chunk.prSize)} ${formatDeltaParenthetical(chunk.delta)}`,
      );
    }
    lines.push(ciLogGapLine());
  }

  lines.push('overall (all chunks)');
  const incomplete = chunks.some((chunk) => chunk.delta === null);
  if (incomplete) {
    lines.push('Base branch : —');
    lines.push(`This branch : — ${overall.reason ?? ''}`.trimEnd());
  } else {
    lines.push(`Base branch : ${formatKb(overall.baseSize)}`);
    lines.push(
      `This branch : ${formatKb(overall.prSize)} ${formatDeltaParenthetical(overall.delta)}`,
    );
  }

  lines.push(...formatFailureLines(configFailures, absoluteFailures));
  return lines.join('\n').trimEnd();
}

/** @param {ChunkResult[]} chunks @param {OverallResult} overall @param {number} maxBytes @param {boolean} passed @param {{ name: string; reason: string }[]} configFailures @param {{ name: string; size: number; sizeLimit: number | null }[]} absoluteFailures */
function formatStepSummaryMarkdown(
  chunks,
  overall,
  maxBytes,
  passed,
  configFailures,
  absoluteFailures,
) {
  const title = passed ? '### Bundle size (within limit)' : '### Bundle size (limit exceeded)';
  const rows = chunks
    .map((chunk) => {
      if (chunk.delta === null) {
        return `| ${chunk.name} | — | — | ${chunk.reason ?? 'n/a'} |`;
      }
      return `| ${chunk.name} | ${formatKb(chunk.baseSize)} | ${formatKb(chunk.prSize)} | ${formatDeltaParenthetical(chunk.delta)} |`;
    })
    .join('\n');

  const overallStatus = passed ? '✅' : '❌';
  const incomplete = chunks.some((chunk) => chunk.delta === null);
  const overallRow = incomplete
    ? `| **Overall** | — | — | ${overall.reason ?? 'n/a'} |`
    : `| **Overall** | ${formatKb(overall.baseSize)} | ${formatKb(overall.prSize)} | ${overallStatus} ${formatDeltaParenthetical(overall.delta)} |`;

  return [
    title,
    '',
    `Max total growth (sum of all chunks): **${formatMaxGrowth(maxBytes)}**`,
    '',
    '| Chunk | Base branch | This branch | Change |',
    '| --- | --- | --- | --- |',
    rows,
    overallRow,
    ...formatFailureLines(configFailures, absoluteFailures),
    '',
  ].join('\n');
}

const { basePath, prPath, maxBytes, outputPath, configPath, baseConfigPath, prConfigPath } =
  parseArgs(process.argv.slice(2));
const baseChecks = readSizeLimitJson(basePath);
const prChecks = readSizeLimitJson(prPath);
const { map: baseByName, duplicates: baseResultDuplicates } = checksByName(baseChecks);
const { map: prByName, duplicates: prResultDuplicates } = checksByName(prChecks);

/** @type {{ name: string; reason: string }[]} */
const configFailures = [];
for (const name of [...new Set([...baseResultDuplicates, ...prResultDuplicates])]) {
  configFailures.push({ name, reason: 'duplicated in size-limit output' });
}

if (baseConfigPath && prConfigPath) {
  const baseConfig = readNamedConfig(baseConfigPath);
  const prConfig = readNamedConfig(prConfigPath);
  for (const name of baseConfig.duplicates) {
    configFailures.push({ name, reason: 'duplicated in base .size-limit.json' });
  }
  for (const name of prConfig.duplicates) {
    configFailures.push({ name, reason: 'duplicated in PR .size-limit.json' });
  }
  for (const name of baseConfig.map.keys()) {
    if (!prConfig.map.has(name)) {
      configFailures.push({ name, reason: 'removed or renamed in PR .size-limit.json' });
    }
  }
}

const comparisonConfig = configPath ? readNamedConfig(configPath) : undefined;
if (comparisonConfig) {
  for (const name of comparisonConfig.duplicates) {
    configFailures.push({ name, reason: 'duplicated in comparison config' });
  }
}
const names = comparisonConfig
  ? [...comparisonConfig.map.keys()]
  : [...new Set([...prByName.keys(), ...baseByName.keys()])];

/** @type {ChunkResult[]} */
const chunks = [];

for (const name of names) {
  const baseSize = baseByName.get(name)?.size;
  const prSize = prByName.get(name)?.size;

  if (baseSize === undefined || prSize === undefined) {
    const reason =
      baseSize === undefined && prSize !== undefined
        ? 'missing on base (stale dist/ or build failed — rm -rf dist before each build)'
        : prSize === undefined && baseSize !== undefined
          ? 'missing on PR (stale dist/ or build failed — rm -rf dist before each build)'
          : 'missing on base and PR (no matching dist files for this chunk)';
    chunks.push({
      name,
      baseSize: baseSize ?? null,
      prSize: prSize ?? null,
      delta: null,
      reason,
    });
    continue;
  }

  chunks.push({
    name,
    baseSize,
    prSize,
    delta: prSize - baseSize,
  });
}

const overallBase = computeOverall(chunks);

/** @type {{ name: string; size: number; sizeLimit: number | null }[]} */
const absoluteFailures = [];
for (const check of prByName.values()) {
  const overLimit =
    check.passed === false || (typeof check.sizeLimit === 'number' && check.size > check.sizeLimit);
  if (!overLimit || !check.name) continue;
  absoluteFailures.push({
    name: check.name,
    size: check.size,
    sizeLimit: typeof check.sizeLimit === 'number' ? check.sizeLimit : null,
  });
}

const relativePassed = !overallBase.reason && overallBase.delta <= maxBytes;
const passed = relativePassed && configFailures.length === 0 && absoluteFailures.length === 0;
/** @type {OverallResult} */
const overall = {
  ...overallBase,
  passed,
};
const failureNotes = [];
if (configFailures.length > 0) {
  failureNotes.push(
    configFailures.map((failure) => `${failure.name}: ${failure.reason}`).join('; '),
  );
}
if (overallBase.reason) failureNotes.push(overallBase.reason);
if (absoluteFailures.length > 0) {
  failureNotes.push(
    `absolute ceiling exceeded: ${absoluteFailures
      .map(
        (failure) =>
          `${failure.name} ${formatKb(failure.size)} > ${failure.sizeLimit == null ? 'limit' : formatKb(failure.sizeLimit)}`,
      )
      .join('; ')}`,
  );
}
if (!overallBase.reason && overallBase.delta > maxBytes) {
  failureNotes.push(
    `total growth ${formatDeltaParenthetical(overallBase.delta)} exceeds max ${formatMaxGrowth(maxBytes)} (base ${formatKb(overallBase.baseSize)}, PR ${formatKb(overallBase.prSize)})`,
  );
}
if (failureNotes.length > 0) overall.reason = failureNotes.join('; ');

const report = { maxBytes, passed, overall, chunks, configFailures, absoluteFailures };
if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

const ciReport = formatCiReport(chunks, overall, maxBytes, configFailures, absoluteFailures);
console.log(ciReport);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(
    summaryPath,
    `${formatStepSummaryMarkdown(chunks, overall, maxBytes, passed, configFailures, absoluteFailures)}\n`,
  );
}

if (!passed) {
  console.error(`Failed: ${overall.reason}`);
  process.exit(1);
}
