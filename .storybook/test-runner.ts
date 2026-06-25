import type { TestRunnerConfig } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

const customSnapshotsDir = `${process.cwd()}/__snapshots__`;

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postVisit(page, context) {
    // Wait for DOM and assets to load, then wait for fonts.
    // Note: we skip waitForPageReady() because it calls networkidle,
    // which never resolves with Storybook's HMR websocket connection.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.evaluate(() => document.fonts.ready);

    // Visual regression: capture screenshot and compare to baseline
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir,
      customSnapshotIdentifier: context.id,
      // Allow small pixel differences for font rendering variations
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  },
};

export default config;
