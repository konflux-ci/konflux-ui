import { execSync } from 'node:child_process';
import fs from 'node:fs';

const CANDIDATES_LINUX = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/opt/google/chrome/chrome',
  '/snap/bin/chromium',
];

const CANDIDATES_MAC = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

export function detectChromePath(): string | undefined {
  try {
    const result = execSync(
      'which google-chrome google-chrome-stable chromium chromium-browser 2>/dev/null || true',
      { encoding: 'utf8' },
    ).trim();
    const first = result.split('\n').filter(Boolean)[0];
    if (first && fs.existsSync(first)) {
      return first;
    }
  } catch {
    // `which` may not be available on all systems
  }

  const candidates = process.platform === 'darwin' ? CANDIDATES_MAC : CANDIDATES_LINUX;
  return candidates.find((p) => fs.existsSync(p));
}

export function requireChromePath(): string {
  const chromePath = detectChromePath();
  if (!chromePath) {
    const msg = [
      'Could not find Chrome or Chromium on this system.',
      'Install one of:',
      '  - Google Chrome (https://www.google.com/chrome/)',
      '  - Chromium (apt install chromium / dnf install chromium)',
      'Or set CHROME_PATH env var to the executable path.',
    ].join('\n');
    throw new Error(msg);
  }
  return chromePath;
}
