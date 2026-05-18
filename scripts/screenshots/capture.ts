#!/usr/bin/env npx tsx

/**
 * Screenshot capture script.
 *
 * Usage:
 *   npx tsx scripts/screenshots/capture.ts --render-file ./tmp/render-foo.tsx
 *
 * Starts a temporary Vite dev server, opens headless Chromium via Playwright,
 * navigates to each scenario defined in the render file, captures screenshots,
 * and writes them to scripts/screenshots/tmp/.
 *
 * --render-file accepts paths relative to scripts/screenshots/ or to cwd:
 *   ./tmp/render-foo.tsx                          (from skill / scripts dir)
 *   scripts/screenshots/tmp/render-foo.tsx         (from workspace root)
 *
 * Outputs a JSON array of { scenarioId, label, filePath } to stdout on success.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const TMP_DIR = path.join(SCRIPTS_DIR, 'tmp');

interface Scenario {
  id: string;
  label: string;
}

interface CaptureResult {
  scenarioId: string;
  label: string;
  filePath: string;
}

/**
 * Resolve --render-file to an absolute path. Accepts:
 *   - Absolute paths
 *   - Paths relative to scripts/screenshots/ (skill usage: ./tmp/render-foo.tsx)
 *   - Paths relative to cwd (manual usage: scripts/screenshots/tmp/render-foo.tsx)
 */
function resolveRenderFile(renderFilePath: string): string | null {
  if (path.isAbsolute(renderFilePath)) {
    return fs.existsSync(renderFilePath) ? renderFilePath : null;
  }

  const fromScriptsDir = path.resolve(SCRIPTS_DIR, renderFilePath);
  if (fs.existsSync(fromScriptsDir)) {
    return fromScriptsDir;
  }

  const fromCwd = path.resolve(process.cwd(), renderFilePath);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }

  return null;
}

async function main() {
  const { values } = parseArgs({
    options: {
      'render-file': { type: 'string' },
      prefix: { type: 'string', default: 'screenshot' },
      width: { type: 'string', default: '1280' },
      height: { type: 'string', default: '900' },
    },
    strict: true,
  });

  const renderFilePath = values['render-file'];
  if (!renderFilePath) {
    throw new Error('Usage: capture.ts --render-file <path>');
  }

  const absoluteRenderFile = resolveRenderFile(renderFilePath);
  if (!absoluteRenderFile) {
    throw new Error(
      `Render file not found: ${renderFilePath}\n` +
        `  Tried: ${path.resolve(SCRIPTS_DIR, renderFilePath)}\n` +
        `  Tried: ${path.resolve(process.cwd(), renderFilePath)}`,
    );
  }

  const prefix = values.prefix ?? 'screenshot';
  const viewportWidth = parseInt(values.width ?? '1280', 10);
  const viewportHeight = parseInt(values.height ?? '900', 10);

  const server = await createServer({
    configFile: path.join(SCRIPTS_DIR, 'vite.config.ts'),
    server: { port: 0 },
    logLevel: 'warn',
  });
  await server.listen();

  let browser: Browser | undefined;
  try {
    const address = server.httpServer?.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to get Vite server address');
    }

    const baseUrl = `http://localhost:${address.port}`;
    const relativeRenderFile = path.relative(SCRIPTS_DIR, absoluteRenderFile);
    const viteImportPath = `./${relativeRenderFile}`;

    browser = await chromium.launch({ headless: true });

    const scenarios = await loadScenarioMetadataViaBrowser(
      browser,
      baseUrl,
      viteImportPath,
      viewportWidth,
      viewportHeight,
    );
    if (scenarios.length === 0) {
      throw new Error('No scenarios found in render file');
    }

    const results: CaptureResult[] = [];

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const page = await browser.newPage({
        viewport: { width: viewportWidth, height: viewportHeight },
      });

      const url = `${baseUrl}/?renderFile=${encodeURIComponent(viteImportPath)}&scenario=${i}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const readyOrError = await page
        .waitForSelector('#harness-ready, #harness-error', { timeout: 15000 })
        .catch(() => null);

      if (!readyOrError) {
        console.error(`Scenario "${scenario.id}": timed out waiting for render`);
        await page.close();
        continue;
      }

      const errorEl = await page.$('#harness-error');
      if (errorEl) {
        const errorText = await errorEl.textContent();
        console.error(`Scenario "${scenario.id}": render error — ${errorText}`);
        await page.close();
        continue;
      }

      const filename = `${prefix}-${scenario.id}.png`;
      const filePath = path.join(TMP_DIR, filename);

      await page.screenshot({ path: filePath, fullPage: true });
      results.push({
        scenarioId: scenario.id,
        label: scenario.label,
        filePath,
      });

      await page.close();
    }

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser?.close();
    await server.close();
  }
}

/**
 * Extract scenario metadata (id + label) by loading the render file in a
 * real browser page via dynamic import. This avoids all SSR compatibility
 * issues (localStorage, CJS packages, SVG/asset imports, SCSS).
 */
async function loadScenarioMetadataViaBrowser(
  browser: Browser,
  baseUrl: string,
  viteImportPath: string,
  width: number,
  height: number,
): Promise<Scenario[]> {
  const page: Page = await browser.newPage({ viewport: { width, height } });

  try {
    const url = `${baseUrl}/?renderFile=${encodeURIComponent(viteImportPath)}&scenario=0`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page
      .waitForSelector('#harness-ready, #harness-error, #harness-loading', { timeout: 15000 })
      .catch(() => null);

    const scenarios = await page.evaluate(async (importPath: string) => {
      const mod = await import(/* @vite-ignore */ importPath);
      const raw: unknown[] = mod.scenarios ?? mod.default?.scenarios ?? mod.default;

      if (!Array.isArray(raw)) {
        return [];
      }

      return raw.map((entry: unknown, i: number) => {
        const s = entry as Record<string, unknown>;
        return {
          id: typeof s.id === 'string' ? s.id : `scenario-${i}`,
          label: typeof s.label === 'string' ? s.label : `Scenario ${i}`,
        };
      });
    }, viteImportPath);

    return scenarios;
  } finally {
    await page.close();
  }
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
