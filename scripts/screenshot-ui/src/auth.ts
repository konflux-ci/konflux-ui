import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'playwright';
import type { StorageState } from './types.js';

export function authStateExists(authStatePath: string): boolean {
  return fs.existsSync(authStatePath);
}

export function loadStorageState(authStatePath: string): StorageState | undefined {
  if (!authStateExists(authStatePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(authStatePath, 'utf8')) as StorageState;
}

export async function applyStorageState(page: Page, authStatePath: string): Promise<boolean> {
  const state = loadStorageState(authStatePath);
  if (!state) {
    return false;
  }

  if (state.cookies.length > 0) {
    await page.context().addCookies(state.cookies);
  }

  for (const origin of state.origins) {
    await page.goto(origin.origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate((entries) => {
      for (const entry of entries) {
        window.localStorage.setItem(entry.name, entry.value);
      }
    }, origin.localStorage);
  }

  return true;
}

export async function saveStorageState(page: Page, authStatePath: string): Promise<void> {
  fs.mkdirSync(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
}

export async function isAuthenticated(page: Page, devServerUrl: string): Promise<boolean> {
  await page.goto(`${devServerUrl.replace(/\/$/, '')}/ns`, {
    waitUntil: 'domcontentloaded',
  });

  const currentUrl = page.url();
  return !currentUrl.includes('/oauth2/sign_in');
}

export async function waitForManualLogin(
  page: Page,
  devServerUrl: string,
  timeoutMs = 5 * 60 * 1000,
): Promise<void> {
  await page.goto(devServerUrl, { waitUntil: 'domcontentloaded' });

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isAuthenticated(page, devServerUrl)) {
      return;
    }
    await page.waitForTimeout(1000);
  }

  throw new Error('Timed out waiting for manual login. Complete OAuth in the browser window.');
}

export async function ensureAuthenticated(
  page: Page,
  devServerUrl: string,
  authStatePath: string,
  headless: boolean,
): Promise<void> {
  const restored = await applyStorageState(page, authStatePath);
  if (restored && (await isAuthenticated(page, devServerUrl))) {
    return;
  }

  if (headless) {
    throw new Error(
      `Authentication required. Run with HEADLESS=false to log in once:\n` +
        `  yarn screenshot-ui\n` +
        `Session will be saved to ${authStatePath}`,
    );
  }

  console.log('Complete login in the browser window (including 2FA if prompted)...');
  await waitForManualLogin(page, devServerUrl);
  await saveStorageState(page, authStatePath);
  console.log(`Saved authenticated session to ${authStatePath}`);
}
