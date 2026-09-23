#!/usr/bin/env node
/**
 * Reads size-limit --json output and prints a PR comment body (markdown).
 * Usage: node .github/scripts/format-size-limit-comment.mjs size-limit.json
 */

import { readFileSync } from 'node:fs';

const resultsPath = process.argv[2];
if (!resultsPath) {
  console.error('Usage: node format-size-limit-comment.mjs <size-limit.json>');
  process.exit(1);
}

const docsUrl =
  'https://github.com/konflux-ci/konflux-ui/blob/main/docs/bundle-size-budgets.md';

/** @param {number} size */
function formatBytes(size) {
  const units = ['B', 'kB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? String(Math.round(value)) : `${Math.round(value * 100) / 100}`;
  return `${rounded} ${units[unitIndex]}`;
}

const raw = readFileSync(resultsPath, 'utf8').trim();
/** @type {{ name?: string; passed?: boolean; size?: number; sizeLimit?: number }[]} */
let checks;
try {
  checks = JSON.parse(raw);
} catch {
  console.error('Expected size-limit --json output (JSON array)');
  process.exit(1);
}

if (!Array.isArray(checks)) {
  console.error('Expected size-limit --json output (JSON array)');
  process.exit(1);
}

const failures = checks
  .filter((check) => check.passed === false && typeof check.size === 'number')
  .map((check) => {
    const limit = check.sizeLimit ?? 0;
    const exceededBy = Math.max(0, check.size - limit);
    return {
      name: check.name ?? 'unknown',
      limit: formatBytes(limit),
      size: formatBytes(check.size),
      exceededBy: formatBytes(exceededBy),
    };
  });

const failedSection =
  failures.length > 0
    ? failures
        .map(
          (f) =>
            `- **\`${f.name}\`**: ${f.size} — limit **${f.limit}** (exceeded by **${f.exceededBy}**)`,
        )
        .join('\n')
    : '_No failed checks in size-limit JSON — see raw output below._';

const body = [
  '### Bundle size limit exceeded',
  '',
  'The following gzip budget(s) in `.size-limit.json` were exceeded:',
  '',
  failedSection,
  '',
  '**Why these limits exist:** Budgets are set with ~10–15% headroom above current gzip sizes so routine changes do not fail CI. This buffer accounts for normal code churn without letting bundle growth go unnoticed. Increase a limit only when the size growth is intentional (e.g. a new dependency or feature), and explain the increase in the PR description.',
  '',
  '<details><summary>size-limit --json output</summary>',
  '',
  '```json',
  JSON.stringify(checks, null, 2),
  '```',
  '',
  '</details>',
  '',
  `See [docs/bundle-size-budgets.md](${docsUrl}) for how to fix or update limits.`,
].join('\n');

process.stdout.write(body);
