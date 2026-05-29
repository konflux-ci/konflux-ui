#!/usr/bin/env node
import { analyzeDiff } from './analyze-diff.js';
import { DEFAULT_BASE_REF, DEFAULT_DEV_SERVER_URL } from './constants.js';

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, true);
      continue;
    }

    args.set(key, next);
    index += 1;
  }

  return args;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const baseRef = String(args.get('base') ?? process.env.SCREENSHOT_BASE ?? DEFAULT_BASE_REF);
  const headRef = String(args.get('head') ?? 'HEAD');
  const devServerUrl = String(
    args.get('dev-server') ?? process.env.DEV_SERVER_URL ?? DEFAULT_DEV_SERVER_URL,
  );

  const analysis = analyzeDiff(baseRef, headRef, devServerUrl);

  // Output as JSON for the agent to consume
  console.log(JSON.stringify(analysis, null, 2));
}

main();
