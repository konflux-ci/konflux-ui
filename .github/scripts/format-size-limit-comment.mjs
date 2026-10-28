#!/usr/bin/env node
/**
 * Reads bundle delta report JSON and prints a PR comment body (markdown).
 * Usage: node .github/scripts/format-size-limit-comment.mjs bundle-size-delta.json
 */

import { readFileSync } from 'node:fs';

const resultsPath = process.argv[2];
if (!resultsPath) {
  console.error('Usage: node format-size-limit-comment.mjs <bundle-size-delta.json>');
  process.exit(1);
}

const docsUrl = 'https://github.com/konflux-ci/konflux-ui/blob/main/docs/bundle-size-budgets.md';

/** @param {number} size */
function formatBytes(size) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const sign = size < 0 ? '-' : '';
  let value = Math.abs(size);
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? String(Math.round(value)) : `${Math.round(value * 100) / 100}`;
  return `${sign}${rounded} ${units[unitIndex]}`;
}

/** @param {number} maxBytes */
function formatMaxGrowth(maxBytes) {
  if (maxBytes === 2048) {
    return '2 kB';
  }
  return formatBytes(maxBytes);
}

/** @param {number} deltaBytes */
function formatSignedDelta(deltaBytes) {
  const sign = deltaBytes >= 0 ? '+' : '';
  return `${sign}${formatBytes(deltaBytes)}`;
}

const raw = readFileSync(resultsPath, 'utf8').trim();
/** @type {{
 *   maxBytes?: number;
 *   passed?: boolean;
 *   overall?: { baseSize: number; prSize: number; delta: number; passed?: boolean; reason?: string };
 *   chunks?: { name: string; baseSize: number | null; prSize: number | null; delta: number | null; reason?: string }[];
 * }} */
let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error('Expected bundle-size-delta JSON object');
  process.exit(1);
}

const maxBytes = report.maxBytes ?? 2048;
const chunks = Array.isArray(report.chunks) ? report.chunks : [];
const overall = report.overall;

const chunkBreakdown = chunks
  .filter((chunk) => chunk.delta !== null)
  .map((chunk) => {
    const deltaLabel = formatSignedDelta(chunk.delta);
    return `- **\`${chunk.name}\`**: ${deltaLabel} vs base (base **${formatBytes(chunk.baseSize)}**, PR **${formatBytes(chunk.prSize)}**)`;
  })
  .join('\n');

const overallSection =
  overall?.reason != null
    ? `- **Overall**: ${overall.reason}`
    : overall
      ? `- **Overall**: ${formatSignedDelta(overall.delta)} vs base (base **${formatBytes(overall.baseSize)}**, PR **${formatBytes(overall.prSize)}**); limit **${formatMaxGrowth(maxBytes)}** total across all chunks`
      : '_Overall totals missing from report — see JSON below._';

const body = [
  '<!-- size-limit-budget -->',
  '### Bundle size growth limit exceeded',
  '',
  `Total gzip size across all measured chunks may grow by at most **${formatMaxGrowth(maxBytes)}** compared to the PR base branch.`,
  '',
  overallSection,
  '',
  '**Per-chunk breakdown:**',
  '',
  chunkBreakdown.length > 0 ? chunkBreakdown : '_No comparable chunks in report._',
  '',
  'Shrink the change, split it across PRs, or discuss an exception with maintainers if the growth is intentional.',
  '',
  '<details><summary>bundle size delta report</summary>',
  '',
  '```json',
  JSON.stringify(report, null, 2),
  '```',
  '',
  '</details>',
  '',
  `See [docs/bundle-size-budgets.md](${docsUrl}) for how chunks are measured.`,
].join('\n');

process.stdout.write(body);
