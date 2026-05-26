import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ensureAuthenticated } from './auth.js';
import {
  createStagehandSession,
  waitForPageReady,
  type StagehandSession,
} from './stagehand-client.js';
import type {
  CaptureResult,
  CapturedScreenshot,
  NavigationPlan,
  NavigationStep,
  ScreenshotUiOptions,
  SkippedTarget,
} from './types.js';

async function executeStep(
  session: StagehandSession,
  step: NavigationStep,
  outputDir: string,
  plan: NavigationPlan,
): Promise<CapturedScreenshot | undefined> {
  const { stagehand, page } = session;

  switch (step.type) {
    case 'goto':
      await page.goto(step.url, { waitUntil: 'domcontentloaded' });
      return undefined;
    case 'wait':
      await waitForPageReady(page);
      return undefined;
    case 'act':
      await stagehand.act(step.instruction, { page });
      return undefined;
    case 'screenshot': {
      await waitForPageReady(page);
      fs.mkdirSync(outputDir, { recursive: true });
      const screenshotPath = path.join(outputDir, step.name);
      await page.screenshot({
        path: screenshotPath,
        fullPage: step.fullPage ?? true,
      });
      return {
        path: screenshotPath,
        label: plan.label,
        planId: plan.id,
      };
    }
    default:
      return undefined;
  }
}

async function pageHasData(session: StagehandSession): Promise<boolean> {
  try {
    const result = await session.stagehand.extract(
      'Does this page show meaningful application data such as table rows, detail content, or non-empty lists? Answer true or false.',
      z.object({ hasData: z.boolean() }),
      { page: session.page },
    );
    return result.hasData;
  } catch {
    return true;
  }
}

async function discoverNamespace(
  session: StagehandSession,
  devServerUrl: string,
): Promise<string | undefined> {
  await session.page.goto(`${devServerUrl.replace(/\/$/, '')}/ns`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForPageReady(session.page);

  try {
    const namespaces = await session.stagehand.extract(
      'extract the list of namespace names visible in the Namespaces table',
      z.array(z.string()),
      { page: session.page },
    );

    return namespaces[0];
  } catch {
    return undefined;
  }
}

async function executePlan(
  session: StagehandSession,
  plan: NavigationPlan,
  options: ScreenshotUiOptions,
): Promise<{ screenshots: CapturedScreenshot[]; skipped?: SkippedTarget }> {
  const screenshots: CapturedScreenshot[] = [];

  for (const step of plan.steps) {
    if (step.type === 'screenshot') {
      const hasData = await pageHasData(session);
      if (!hasData) {
        return {
          screenshots,
          skipped: {
            planId: plan.id,
            label: plan.label,
            reason: 'No resources available on this page to capture a meaningful screenshot',
          },
        };
      }
    }

    const captured = await executeStep(session, step, options.outputDir, plan);
    if (captured) {
      screenshots.push(captured);
    }
  }

  return { screenshots };
}

export async function captureScreenshots(
  plans: NavigationPlan[],
  options: ScreenshotUiOptions,
): Promise<CaptureResult> {
  if (plans.length === 0) {
    return { screenshots: [], skipped: [] };
  }

  fs.mkdirSync(path.dirname(options.authStatePath), { recursive: true });
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.mkdirSync(options.cacheDir, { recursive: true });

  const session = await createStagehandSession(options);

  try {
    await ensureAuthenticated(
      session.page,
      options.devServerUrl,
      options.authStatePath,
      options.headless,
    );

    let namespace = options.namespace;
    if (!namespace) {
      namespace = await discoverNamespace(session, options.devServerUrl);
    }

    const screenshots: CapturedScreenshot[] = [];
    const skipped: SkippedTarget[] = [];

    for (const plan of plans) {
      try {
        const result = await executePlan(session, plan, options);
        screenshots.push(...result.screenshots);
        if (result.skipped) {
          skipped.push(result.skipped);
        }
      } catch (error) {
        skipped.push({
          planId: plan.id,
          label: plan.label,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      screenshots,
      skipped,
      namespace,
    };
  } finally {
    await session.close();
  }
}
