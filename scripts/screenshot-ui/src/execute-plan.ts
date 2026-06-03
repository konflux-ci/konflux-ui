import type { Page } from 'playwright-core';
import type { InteractionHint, NavigationPlan, NavigationStep } from './types.js';

const STEP_TIMEOUT = 15_000;
const WAIT_AFTER_NAVIGATION = 2_000;

type StepResult = { ok: true } | { ok: false; error: string };

async function executeHint(page: Page, hint: InteractionHint, tabSegment?: string): Promise<void> {
  switch (hint) {
    case 'namespace-select':
      await page
        .locator('table tbody tr td a[href*="/ns/"]')
        .first()
        .click({ timeout: STEP_TIMEOUT });
      break;

    case 'sidebar-applications':
      await page.getByRole('link', { name: /^Applications$/i }).click({ timeout: STEP_TIMEOUT });
      break;
    case 'sidebar-components':
      await page.getByRole('link', { name: /^Components$/i }).click({ timeout: STEP_TIMEOUT });
      break;
    case 'sidebar-secrets':
      await page.getByRole('link', { name: /^Secrets$/i }).click({ timeout: STEP_TIMEOUT });
      break;

    case 'click-first-application':
    case 'click-first-component':
    case 'click-first-pipeline-run':
    case 'click-first-task-run':
    case 'click-first-commit':
    case 'click-first-release':
    case 'click-first-snapshot':
    case 'click-first-integration-test':
    case 'click-first-release-plan':
      await page
        .locator('table tbody tr td a, [class*="list"] a[href]')
        .first()
        .click({ timeout: STEP_TIMEOUT });
      break;

    case 'click-tab': {
      const label = tabSegment
        ?.split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      if (label) {
        await page
          .getByRole('tab', { name: new RegExp(label, 'i') })
          .click({ timeout: STEP_TIMEOUT });
      }
      break;
    }

    default:
      break;
  }
}

async function executeStep(page: Page, step: NavigationStep): Promise<StepResult> {
  try {
    switch (step.type) {
      case 'goto':
        await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(WAIT_AFTER_NAVIGATION);
        break;

      case 'wait':
        await page.waitForLoadState('networkidle', { timeout: STEP_TIMEOUT }).catch(() => {
          // networkidle can be flaky; continue after timeout
        });
        break;

      case 'act':
        await executeHint(page, step.hint, step.tabSegment);
        await page.waitForTimeout(1_000);
        break;

      case 'screenshot':
        // handled externally
        break;
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type PlanResult = {
  planId: string;
  label: string;
  status: 'captured' | 'skipped';
  screenshotPath?: string;
  skipReason?: string;
};

export async function executePlan(
  page: Page,
  plan: NavigationPlan,
  outputDir: string,
): Promise<PlanResult> {
  for (const step of plan.steps) {
    if (step.type === 'screenshot') {
      const filePath = `${outputDir}/${step.name}`;
      try {
        await page.screenshot({
          path: filePath,
          fullPage: step.fullPage ?? true,
        });
        return { planId: plan.id, label: plan.label, status: 'captured', screenshotPath: filePath };
      } catch (err) {
        return {
          planId: plan.id,
          label: plan.label,
          status: 'skipped',
          skipReason: `Screenshot failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    const result = await executeStep(page, step);
    if (!result.ok) {
      return {
        planId: plan.id,
        label: plan.label,
        status: 'skipped',
        skipReason: `Step "${step.type}" failed: ${result.error}`,
      };
    }
  }

  return {
    planId: plan.id,
    label: plan.label,
    status: 'skipped',
    skipReason: 'No screenshot step in plan',
  };
}
