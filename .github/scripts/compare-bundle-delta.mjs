#!/usr/bin/env node
/**
 * Compares size-limit --json output from base and PR builds.
 * Fails when total gzip growth across all chunks exceeds --max-bytes (default 2048) vs base.
 *
 * Usage:
 *   node compare-bundle-delta.mjs base.json pr.json [--max-bytes 2048] [--output report.json]
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_MAX_BYTES = 2048;

/** @param {string[]} argv */
function parseArgs(argv) {
  const positional = [];
  let maxBytes = DEFAULT_MAX_BYTES;
  let outputPath;

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
      outputPath = argv[++i];
      if (!outputPath) {
        console.error('--output requires a file path');
        process.exit(2);
      }
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2) {
    console.error(
      'Usage: node compare-bundle-delta.mjs <base.json> <pr.json> [--max-bytes 2048] [--output report.json]',
    );
    process.exit(2);
  }

  return { basePath: positional[0], prPath: positional[1], maxBytes, outputPath };
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

/** @param {{ name?: string; size?: number }[]} checks */
function checksByName(checks) {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const check of checks) {
    if (!check.name || typeof check.size !== 'number') {
      continue;
    }
    map.set(check.name, check.size);
  }
  return map;
}

/** @param {{ name?: string }[]} prChecks @param {{ name?: string }[]} baseChecks */
function orderedChunkNames(prChecks, baseChecks) {
  const seen = new Set();
  /** @type {string[]} */
  const names = [];
  for (const check of [...prChecks, ...baseChecks]) {
    if (check.name && !seen.has(check.name)) {
      seen.add(check.name);
      names.push(check.name);
    }
  }
  return names;
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
  if (maxBytes === 2048) {
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

/** @param {ChunkResult[]} chunks @param {OverallResult} overall @param {number} maxBytes */
function formatCiReport(chunks, overall, maxBytes) {
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
  if (overall.reason) {
    lines.push('Base branch : —');
    lines.push(`This branch : — ${overall.reason}`);
  } else {
    lines.push(`Base branch : ${formatKb(overall.baseSize)}`);
    lines.push(
      `This branch : ${formatKb(overall.prSize)} ${formatDeltaParenthetical(overall.delta)}`,
    );
  }

  return lines.join('\n').trimEnd();
}

/** @param {ChunkResult[]} chunks @param {OverallResult} overall @param {number} maxBytes @param {boolean} passed */
function formatStepSummaryMarkdown(chunks, overall, maxBytes, passed) {
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
  const overallRow = overall.reason
    ? `| **Overall** | — | — | ${overall.reason} |`
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
    '',
  ].join('\n');
}

const { basePath, prPath, maxBytes, outputPath } = parseArgs(process.argv.slice(2));
const baseChecks = readSizeLimitJson(basePath);
const prChecks = readSizeLimitJson(prPath);
const baseByName = checksByName(baseChecks);
const prByName = checksByName(prChecks);

const names = orderedChunkNames(prChecks, baseChecks);

/** @type {ChunkResult[]} */
const chunks = [];

for (const name of names) {
  const baseSize = baseByName.get(name);
  const prSize = prByName.get(name);

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
/** @type {OverallResult} */
const overall = {
  ...overallBase,
  passed: overallBase.reason ? false : overallBase.delta <= maxBytes,
};

const passed = overall.passed;
const report = { maxBytes, passed, overall, chunks };
if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

const ciReport = formatCiReport(chunks, overall, maxBytes);
console.log(ciReport);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(summaryPath, `${formatStepSummaryMarkdown(chunks, overall, maxBytes, passed)}\n`);
}

if (!passed) {
  console.error('');
  if (overall.reason) {
    console.error(`Failed: ${overall.reason}`);
  } else {
    console.error(
      `Failed: total growth ${formatDeltaParenthetical(overall.delta)} exceeds max ${formatMaxGrowth(maxBytes)} (base ${formatKb(overall.baseSize)}, PR ${formatKb(overall.prSize)}).`,
    );
  }
  process.exit(1);
}
