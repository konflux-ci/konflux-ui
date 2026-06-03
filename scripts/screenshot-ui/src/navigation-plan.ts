import path from 'node:path';
import { SIDEBAR_LABELS } from './constants.js';
import { buildUrlFromRoute } from './path-resolver.js';
import type { InteractionHint, NavigationPlan, NavigationStep, RouteTarget } from './types.js';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function tabLabel(tabSegment?: string): string {
  if (!tabSegment) {
    return 'Details';
  }
  return tabSegment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function hintToActInstruction(hint: InteractionHint, tabSegment?: string): string | undefined {
  const instructions: Partial<Record<InteractionHint, string>> = {
    'namespace-select': 'click on the first namespace in the Namespaces table',
    'sidebar-applications': "click 'Applications' in the sidebar",
    'sidebar-components': "click 'Components' in the sidebar",
    'sidebar-secrets': "click 'Secrets' in the sidebar",
    'click-first-application': 'click on the first application in the applications table',
    'click-first-component': 'click on the first component in the components table',
    'click-first-pipeline-run': 'click on the first pipeline run in the list',
    'click-first-task-run': 'click on the first task run in the list',
    'click-first-commit': 'click on the first commit in the list',
    'click-first-release': 'click on the first release in the list',
    'click-first-snapshot': 'click on the first snapshot in the list',
    'click-first-integration-test': 'click on the first integration test in the list',
    'click-first-release-plan': 'click on the first release plan in the list',
    'click-tab': `click the '${tabLabel(tabSegment)}' tab`,
  };
  return instructions[hint];
}

function sidebarHintForRoute(routePath: string): InteractionHint | undefined {
  if (routePath.includes('/applications')) {
    return 'sidebar-applications';
  }
  if (routePath.includes('/components')) {
    return 'sidebar-components';
  }
  if (routePath.includes('/secrets')) {
    return 'sidebar-secrets';
  }
  return undefined;
}

function buildStepsForTarget(
  target: RouteTarget,
  devServerUrl: string,
  namespace?: string,
): NavigationStep[] {
  const steps: NavigationStep[] = [];
  const params: Record<string, string> = namespace ? { workspaceName: namespace } : {};

  const directUrl = buildUrlFromRoute(target.routePath, devServerUrl, params);
  const needsNamespaceDiscovery = target.routePath.includes(':workspaceName') && !namespace;

  if (needsNamespaceDiscovery) {
    steps.push({ type: 'goto', url: `${devServerUrl.replace(/\/$/, '')}/ns` });
    steps.push({ type: 'wait', condition: 'networkidle' });
    steps.push({
      type: 'act',
      instruction: hintToActInstruction('namespace-select')!,
      hint: 'namespace-select',
    });
    steps.push({ type: 'wait', condition: 'networkidle' });
  } else if (
    directUrl &&
    !target.interactionHints.some((hint) => hint.startsWith('click-first-'))
  ) {
    steps.push({ type: 'goto', url: directUrl });
    steps.push({ type: 'wait', condition: 'networkidle' });
  } else if (namespace) {
    const listPath = target.routePath.split('/:')[0];
    const listUrl = buildUrlFromRoute(listPath, devServerUrl, { workspaceName: namespace });
    if (listUrl) {
      steps.push({ type: 'goto', url: listUrl });
      steps.push({ type: 'wait', condition: 'networkidle' });
    }
  } else {
    steps.push({ type: 'goto', url: `${devServerUrl.replace(/\/$/, '')}/ns` });
    steps.push({ type: 'wait', condition: 'networkidle' });
    steps.push({
      type: 'act',
      instruction: hintToActInstruction('namespace-select')!,
      hint: 'namespace-select',
    });
    steps.push({ type: 'wait', condition: 'networkidle' });
  }

  const sidebarHint = sidebarHintForRoute(target.routePath);
  if (sidebarHint && needsNamespaceDiscovery) {
    const instruction = hintToActInstruction(sidebarHint);
    if (instruction) {
      steps.push({ type: 'act', instruction, hint: sidebarHint });
      steps.push({ type: 'wait', condition: 'networkidle' });
    }
  }

  for (const hint of target.interactionHints) {
    if (hint === 'namespace-select') {
      continue;
    }

    const instruction = hintToActInstruction(hint, target.tabSegment);
    if (instruction) {
      steps.push({ type: 'act', instruction, hint, tabSegment: target.tabSegment });
      steps.push({ type: 'wait', condition: 'networkidle' });
    }
  }

  const screenshotName = `${slugify(target.routePath)}.png`;
  steps.push({
    type: 'screenshot',
    name: screenshotName,
    fullPage: true,
  });

  return steps;
}

export function buildNavigationPlans(
  targets: RouteTarget[],
  changedUiFiles: string[],
  devServerUrl: string,
  namespace?: string,
): NavigationPlan[] {
  if (targets.length === 0 && changedUiFiles.length > 0) {
    return [
      {
        id: 'overview-fallback',
        label: 'Overview (fallback — no route mapping found)',
        changedComponents: changedUiFiles,
        routePath: '/',
        steps: [
          { type: 'goto', url: `${devServerUrl.replace(/\/$/, '')}/ns` },
          { type: 'wait', condition: 'networkidle' },
          {
            type: 'act',
            instruction: namespace
              ? `click on '${namespace}' in the Namespaces table`
              : 'click on the first namespace in the Namespaces table',
            hint: 'namespace-select' as const,
          },
          { type: 'wait', condition: 'networkidle' },
          { type: 'screenshot', name: 'overview-fallback.png', fullPage: true },
        ],
      },
    ];
  }

  return targets.map((target, index) => {
    const componentNames = target.matchedComponents.map((file) => path.basename(file));
    return {
      id: `${slugify(target.routePath)}-${index}`,
      label: `${target.routePath} (${componentNames.join(', ')})`,
      changedComponents: target.matchedComponents,
      routePath: target.routePath,
      steps: buildStepsForTarget(target, devServerUrl, namespace),
    };
  });
}

export function labelForTabSegment(tabSegment?: string): string {
  return tabLabel(tabSegment);
}

export function sidebarLabelForSegment(segment: string): string | undefined {
  return SIDEBAR_LABELS[segment];
}
