#!/usr/bin/env node
/**
 * Reads size-limit CLI output and prints a PR comment body (markdown).
 * Usage: node .github/scripts/format-size-limit-comment.mjs size-limit.log
 */

import { readFileSync } from 'node:fs';

const logPath = process.argv[2];
if (!logPath) {
  console.error('Usage: node format-size-limit-comment.mjs <size-limit.log>');
  process.exit(1);
}

const raw = readFileSync(logPath, 'utf8');
// Strip ANSI color codes from CI output
const output = raw.replace(/\u001B\[[0-9;]*m/g, '').trim();

const repo = process.env.GITHUB_REPOSITORY ?? 'konflux-ci/konflux-ui';
const [owner, repoName] = repo.split('/');
const docsUrl = `https://github.com/${owner}/${repoName}/blob/main/docs/bundle-size-budgets.md`;

/** @type {{ name: string; exceededBy: string; limit: string; size: string }[]} */
const failures = [];

const lines = output.split('\n');
for (let i = 0; i < lines.length; i++) {
  const exceededMatch = lines[i].match(/Package size limit has exceeded by (.+)/);
  if (!exceededMatch) {
    continue;
  }

  let name = 'unknown';
  for (let j = i - 1; j >= 0; j--) {
    const candidate = lines[j].trim();
    if (candidate && !candidate.startsWith('Try to reduce')) {
      name = candidate;
      break;
    }
  }

  const limit = lines[i + 1]?.match(/Size limit:\s*(.+)/)?.[1]?.trim() ?? '—';
  const size = lines[i + 2]?.match(/Size:\s+(.+)/)?.[1]?.trim() ?? '—';

  failures.push({
    name,
    exceededBy: exceededMatch[1].trim(),
    limit,
    size,
  });
}

const failedSection =
  failures.length > 0
    ? failures
        .map(
          (f) =>
            `- **\`${f.name}\`**: ${f.size} — limit **${f.limit}** (exceeded by **${f.exceededBy}**)`,
        )
        .join('\n')
    : '_Could not parse failed chunks — see full output below._';

const body = [
  '### Bundle size limit exceeded',
  '',
  'The following gzip budget(s) in `.size-limit.json` were exceeded:',
  '',
  failedSection,
  '',
  '**Why these limits exist:** Budgets are set with ~10–15% headroom above current gzip sizes so routine changes do not fail CI. This buffer accounts for normal code churn without letting bundle growth go unnoticed. Increase a limit only when the size growth is intentional (e.g. a new dependency or feature), and explain the increase in the PR description.',
  '',
  '<details><summary>Full size-limit output</summary>',
  '',
  '```',
  output,
  '```',
  '',
  '</details>',
  '',
  `See [docs/bundle-size-budgets.md](${docsUrl}) for how to fix or update limits.`,
].join('\n');

process.stdout.write(body);
