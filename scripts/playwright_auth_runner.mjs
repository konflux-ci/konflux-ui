#!/usr/bin/env node
// Opens a headed browser for SSO login, then closes automatically once
// the user is redirected back to the application.  Cookies are persisted
// in the Chrome profile directory so subsequent headless runs skip login.
//
// Expected env vars (set by playwright_auth.sh):
//   CHROME_PATH  – absolute path to Chrome / Chromium executable
//   PROFILE_DIR  – path to the shared persistent profile directory

import { chromium } from 'playwright-core';

const { CHROME_PATH, PROFILE_DIR } = process.env;

if (!CHROME_PATH || !PROFILE_DIR) {
  process.stderr.write('CHROME_PATH and PROFILE_DIR environment variables are required.\n');
  process.exit(1);
}

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  executablePath: CHROME_PATH,
  ignoreHTTPSErrors: true,
});

const page = context.pages()[0] || (await context.newPage());

await page.goto('https://localhost:8080/oauth2/sign_in');

// Wait for the user to complete SSO login and land back on the app.
await page.waitForURL(
  (url) => {
    const u = new URL(url);
    return u.hostname === 'localhost' && u.port === '8080' && !u.pathname.startsWith('/oauth2/');
  },
  { timeout: 300_000 },
);

await context.close();
process.stdout.write('Authentication successful — cookies saved to profile.\n');
