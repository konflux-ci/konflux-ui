import { Stagehand } from '@browserbasehq/stagehand';
import { chromium, type Browser, type Page } from 'playwright';
import type { ScreenshotUiOptions } from './types.js';

export type StagehandSession = {
  stagehand: Stagehand;
  browser: Browser;
  page: Page;
  close: () => Promise<void>;
};

export async function createStagehandSession(
  options: ScreenshotUiOptions,
): Promise<StagehandSession> {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    selfHeal: true,
    domSettleTimeout: 3000,
    cacheDir: options.cacheDir,
    model: process.env.SCREENSHOT_MODEL ?? 'openai/gpt-4o-mini',
    localBrowserLaunchOptions: {
      headless: options.headless,
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
      args: ['--no-sandbox', '--disable-gpu'],
    },
  });

  await stagehand.init();

  const browser = await chromium.connectOverCDP({
    wsEndpoint: stagehand.connectURL(),
  });

  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? (await context.newPage());

  return {
    stagehand,
    browser,
    page,
    close: async () => {
      await stagehand.close();
      await browser.close();
    },
  };
}

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(500);
}

export async function isDevServerRunning(devServerUrl: string): Promise<boolean> {
  try {
    const response = await fetch(devServerUrl, {
      method: 'GET',
      redirect: 'manual',
    });
    return response.status > 0;
  } catch {
    return false;
  }
}
