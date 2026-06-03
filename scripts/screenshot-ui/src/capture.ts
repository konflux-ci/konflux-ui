#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { analyzeDiff } from './analyze-diff.js';
import { requireChromePath } from './browser-detect.js';
import { DEFAULT_BASE_REF, DEFAULT_DEV_SERVER_URL, REPO_ROOT } from './constants.js';
import { executePlan, type PlanResult } from './execute-plan.js';

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, true);
      continue;
    }
    args.set(key, next);
    i += 1;
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const baseRef = String(args.get('base') ?? process.env.SCREENSHOT_BASE ?? DEFAULT_BASE_REF);
  const headRef = String(args.get('head') ?? 'HEAD');
  const devServerUrl = String(
    args.get('dev-server') ?? process.env.DEV_SERVER_URL ?? DEFAULT_DEV_SERVER_URL,
  );
  const chromePath = String(args.get('chrome-path') ?? process.env.CHROME_PATH ?? '');

  const screenshotsDir = path.join(REPO_ROOT, '.screenshots', 'current');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  // Step 1: Analyze diff
  const analysis = analyzeDiff(baseRef, headRef, devServerUrl);

  if (analysis.changedUiFiles.length === 0) {
    console.log(JSON.stringify({ message: 'No UI-visible changes', screenshots: [] }));
    return;
  }

  if (analysis.navigationPlans.length === 0) {
    console.log(
      JSON.stringify({
        message: 'Changed files found but no routes mapped',
        changedFiles: analysis.changedUiFiles,
        screenshots: [],
      }),
    );
    return;
  }

  // Step 2: Launch browser
  const executablePath = chromePath || requireChromePath();
  console.error(`Using browser: ${executablePath}`);

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Step 3: Check auth
  try {
    await page.goto(`${devServerUrl.replace(/\/$/, '')}/ns`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2_000);

    const url = page.url();
    if (url.includes('oauth2/sign_in') || url.includes('/login') || url.includes('/auth/')) {
      console.log(
        JSON.stringify({
          message: 'AUTH_REQUIRED',
          detail: `Browser redirected to ${url}. Log in at ${devServerUrl} first.`,
          screenshots: [],
        }),
      );
      await browser.close();
      return;
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        message: 'DEV_SERVER_UNREACHABLE',
        detail: `Could not reach ${devServerUrl}: ${err instanceof Error ? err.message : String(err)}`,
        screenshots: [],
      }),
    );
    await browser.close();
    return;
  }

  // Step 4: Execute navigation plans
  const results: PlanResult[] = [];

  for (const plan of analysis.navigationPlans) {
    console.error(`Capturing: ${plan.label}`);
    const result = await executePlan(page, plan, screenshotsDir);
    results.push(result);
    console.error(`  → ${result.status}${result.skipReason ? ` (${result.skipReason})` : ''}`);
  }

  await browser.close();

  // Step 5: Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    branch: getBranchName(),
    baseRef,
    screenshots: {
      current: results
        .filter((r) => r.status === 'captured')
        .map((r) => ({ planId: r.planId, path: r.screenshotPath!, label: r.label })),
    },
    skipped: results
      .filter((r) => r.status === 'skipped')
      .map((r) => ({ planId: r.planId, label: r.label, reason: r.skipReason! })),
  };

  const manifestPath = path.join(REPO_ROOT, '.screenshots', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify(manifest, null, 2));
}

function getBranchName(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
