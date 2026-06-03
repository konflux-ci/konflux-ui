import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './constants.js';
import { analyzeComponents } from './component-analyzer.js';
import { findRoutesForChangedFiles } from './route-mapper.js';
import { buildNavigationPlans } from './navigation-plan.js';
import type { AnalysisResult } from './types.js';

const IGNORED_PATH_PARTS = [
  '/__tests__/',
  '/__mocks__/',
  '.spec.tsx',
  '.spec.ts',
  '.test.tsx',
  '.test.ts',
];

function isUiVisibleFile(filePath: string): boolean {
  const normalized = path.normalize(filePath.replace(/^\.\//, ''));

  if (!/\.tsx?$/.test(normalized)) {
    return false;
  }

  if (IGNORED_PATH_PARTS.some((part) => normalized.includes(part))) {
    return false;
  }

  return (
    normalized.startsWith('src/components/') || normalized.startsWith('src/shared/components/')
  );
}

function containsJsx(filePath: string): boolean {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);
  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  return /<[A-Za-z]/.test(content) || /React\.createElement/.test(content);
}

export function getChangedFiles(baseRef: string, headRef = 'HEAD'): string[] {
  const diff = execSync(`git diff ${baseRef}...${headRef} --name-only`, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  return diff
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function analyzeDiff(
  baseRef: string,
  headRef = 'HEAD',
  devServerUrl: string,
): AnalysisResult {
  const changedFiles = getChangedFiles(baseRef, headRef);
  const changedUiFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of changedFiles) {
    if (!isUiVisibleFile(file)) {
      skippedFiles.push(file);
      continue;
    }

    if (!containsJsx(file)) {
      skippedFiles.push(file);
      continue;
    }

    changedUiFiles.push(file);
  }

  const targets = findRoutesForChangedFiles(changedUiFiles);
  const navigationPlans = buildNavigationPlans(targets, changedUiFiles, devServerUrl);
  const componentAnalysis = analyzeComponents(changedUiFiles, baseRef, headRef);

  return {
    changedUiFiles,
    skippedFiles,
    targets,
    navigationPlans,
    componentAnalysis,
  };
}
