#!/usr/bin/env node
// Opens the UI in a headed browser and waits for the running dev server's
// CLI authentication session. Kubelogin may open the default browser for login.
// Authentication lasts until logout or dev-server shutdown, not in this profile.
//
// Expected env vars (set by playwright_auth.sh):
//   CHROME_PATH  – absolute path to Chrome / Chromium executable
//   PROFILE_DIR  – path to the shared persistent profile directory

import { chromium } from 'playwright-core';
import { LOCAL_ORIGIN } from '#dev-auth/constants.mjs';

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

try {
  // Register before navigation. React initiates sign-in from the UI so the
  // request has the same-origin provenance required by the local auth proxy.
  await Promise.all([
    page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return (
          url.origin === LOCAL_ORIGIN &&
          url.pathname === '/oauth2/userinfo' &&
          response.status() === 200
        );
      },
      { timeout: 300_000 },
    ),
    page.goto(LOCAL_ORIGIN),
  ]);
} finally {
  await context.close();
}
process.stdout.write('Authentication successful for the running development server.\n');
