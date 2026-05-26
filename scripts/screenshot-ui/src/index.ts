#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeDiff } from './analyze-diff.js';
import { captureScreenshots } from './capture.js';
import {
  DEFAULT_AUTH_STATE_PATH,
  DEFAULT_BASE_REF,
  DEFAULT_CACHE_DIR,
  DEFAULT_DEV_SERVER_URL,
  DEFAULT_OUTPUT_DIR,
  REPO_ROOT,
} from './constants.js';
import { isDevServerRunning } from './stagehand-client.js';
import type { ScreenshotUiOptions } from './types.js';

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

function buildOptions(args: Map<string, string | boolean>): ScreenshotUiOptions {
  return {
    baseRef: String(args.get('base') ?? process.env.SCREENSHOT_BASE ?? DEFAULT_BASE_REF),
    headRef: String(args.get('head') ?? 'HEAD'),
    devServerUrl: String(
      args.get('dev-server') ?? process.env.DEV_SERVER_URL ?? DEFAULT_DEV_SERVER_URL,
    ),
    namespace: args.get('namespace')
      ? String(args.get('namespace'))
      : process.env.SCREENSHOT_NAMESPACE,
    outputDir: path.resolve(
      String(args.get('output') ?? process.env.SCREENSHOT_OUTPUT ?? DEFAULT_OUTPUT_DIR),
    ),
    authStatePath: path.resolve(
      String(
        args.get('auth-state') ?? process.env.SCREENSHOT_AUTH_STATE ?? DEFAULT_AUTH_STATE_PATH,
      ),
    ),
    cacheDir: path.resolve(
      String(args.get('cache-dir') ?? process.env.SCREENSHOT_CACHE_DIR ?? DEFAULT_CACHE_DIR),
    ),
    headless: args.has('headless')
      ? args.get('headless') !== 'false'
      : process.env.SCREENSHOT_HEADLESS !== 'false',
  };
}

function printSummary(
  analysis: ReturnType<typeof analyzeDiff>,
  capture: Awaited<ReturnType<typeof captureScreenshots>>,
): void {
  console.log('\n=== Screenshot UI Summary ===');
  console.log(`Changed UI files: ${analysis.changedUiFiles.length}`);
  console.log(`Navigation plans: ${analysis.navigationPlans.length}`);
  console.log(`Captured screenshots: ${capture.screenshots.length}`);

  if (capture.namespace) {
    console.log(`Namespace used: ${capture.namespace}`);
  }

  for (const screenshot of capture.screenshots) {
    console.log(`  ✓ ${screenshot.path} (${screenshot.label})`);
  }

  for (const skip of capture.skipped) {
    console.log(`  ✗ ${skip.label}: ${skip.reason}`);
  }
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      'OPENAI_API_KEY is required for Stagehand act/extract. Set it in scripts/screenshot-ui/.env',
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const options = buildOptions(args);
  const analyzeOnly = args.has('analyze-only');

  if (!analyzeOnly && !(await isDevServerRunning(options.devServerUrl))) {
    console.error(
      `Dev server does not appear to be running at ${options.devServerUrl}.\n` +
        'Start it with: yarn start',
    );
    process.exit(1);
  }

  const analysis = analyzeDiff(options.baseRef, options.headRef, options.devServerUrl);

  if (analysis.changedUiFiles.length === 0) {
    console.log('No UI-visible changes detected in the diff.');
    process.exit(0);
  }

  console.log('UI-visible changed files:');
  for (const file of analysis.changedUiFiles) {
    console.log(`  - ${path.relative(REPO_ROOT, file)}`);
  }

  if (analysis.navigationPlans.length === 0) {
    console.log('No route mappings found for changed components.');
    process.exit(0);
  }

  console.log('\nNavigation plans:');
  for (const plan of analysis.navigationPlans) {
    console.log(`  - ${plan.label}`);
    for (const step of plan.steps) {
      if (step.type === 'goto') {
        console.log(`      goto: ${step.url}`);
      } else if (step.type === 'act') {
        console.log(`      act: ${step.instruction}`);
      } else if (step.type === 'screenshot') {
        console.log(`      screenshot: ${step.name}`);
      } else {
        console.log(`      wait: ${step.condition}`);
      }
    }
  }

  if (analyzeOnly) {
    process.exit(0);
  }

  const capture = await captureScreenshots(analysis.navigationPlans, options);

  const manifestPath = path.join(options.outputDir, 'manifest.json');
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        analysis,
        capture,
      },
      null,
      2,
    ),
  );

  printSummary(analysis, capture);

  if (capture.screenshots.length === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
