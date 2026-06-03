import fs from 'node:fs';
import path from 'node:path';
import {
  PARAM_HINTS,
  REPO_ROOT,
  ROUTES_DIR,
  ROUTES_INDEX_FILE,
  TAB_SEGMENTS,
} from './constants.js';
import { parsePathsFile, resolvePathConstant } from './path-resolver.js';
import type { InteractionHint, RouteTarget } from './types.js';

type RouteFileMatch = {
  routeFile: string;
  routeConstant?: string;
  routePath?: string;
  importedModules: string[];
};

function listRouteFiles(): string[] {
  const pageRoutes = fs
    .readdirSync(ROUTES_DIR)
    .filter((file) => file.endsWith('.tsx') && !file.includes('.spec.'))
    .map((file) => path.join(ROUTES_DIR, file));

  return [...pageRoutes, ROUTES_INDEX_FILE];
}

function normalizeImportToRepoPath(importPath: string, routeFile: string): string {
  if (importPath.startsWith('~/')) {
    return path.join(REPO_ROOT, 'src', importPath.slice(2));
  }
  if (importPath.startsWith('@routes/')) {
    return path.join(REPO_ROOT, 'src/routes', importPath.slice(8));
  }
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(routeFile), importPath);
  }
  return importPath;
}

function extractImports(content: string, routeFile: string): string[] {
  const imports: string[] = [];
  const importRegex = /from ['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (
      importPath.startsWith('~/components/') ||
      importPath.startsWith('~/shared/components/') ||
      importPath.includes('/components/') ||
      importPath.startsWith('../components/')
    ) {
      imports.push(normalizeImportToRepoPath(importPath, routeFile));
    }
  }
  return imports;
}

function isFullRoutePath(pathStr: string): boolean {
  const normalized = pathStr.replace(/\$\{RouterParams\.(\w+)\}/g, ':$1');
  return normalized.startsWith('ns') || normalized.startsWith('releasemonitor');
}

function extractRouteConstants(content: string): Array<{ constant?: string; path?: string }> {
  const constants: Array<{ constant?: string; path?: string }> = [];
  const pathConstantRegex = /path:\s*(\w+_PATH(?:\.\w+)?)\.path/g;
  let match: RegExpExecArray | null;
  while ((match = pathConstantRegex.exec(content)) !== null) {
    const constant = match[1].split('.')[0];
    constants.push({ constant, path: resolvePathConstant(constant) });
  }

  const templatePathRegex = /path:\s*[`'"]([^`'"]+)[`'"]/g;
  while ((match = templatePathRegex.exec(content)) !== null) {
    const raw = match[1];
    if (!isFullRoutePath(raw)) {
      continue;
    }
    constants.push({ path: raw.replace(/\$\{RouterParams\.(\w+)\}/g, ':$1') });
  }

  return constants;
}

function fileMatchesImport(changedFile: string, importPath: string): boolean {
  const normalizedChanged = changedFile.replace(/\.tsx?$/, '');
  const normalizedImport = importPath.replace(/\.tsx?$/, '');
  return (
    normalizedChanged === normalizedImport ||
    normalizedChanged.startsWith(`${normalizedImport}/`) ||
    normalizedImport.startsWith(`${normalizedChanged}/`)
  );
}

function buildInteractionHints(routePath: string): {
  hints: InteractionHint[];
  tabSegment?: string;
} {
  const hints: InteractionHint[] = [];
  let tabSegment: string | undefined;

  const segments = routePath.split('/').filter(Boolean);
  for (const segment of segments) {
    if (segment.startsWith(':')) {
      const param = segment.slice(1);
      const hint = PARAM_HINTS[param];
      if (hint) {
        hints.push(hint);
      }
      continue;
    }

    if (TAB_SEGMENTS.has(segment)) {
      tabSegment = segment;
      hints.push('click-tab');
    }
  }

  return { hints: [...new Set(hints)], tabSegment };
}

function parseRouteFile(routeFile: string): RouteFileMatch[] {
  const content = fs.readFileSync(routeFile, 'utf8');
  const importedModules = extractImports(content, routeFile);
  const routeConstants = extractRouteConstants(content);

  if (routeConstants.length === 0) {
    return [
      {
        routeFile,
        importedModules,
      },
    ];
  }

  return routeConstants.map((route) => ({
    routeFile,
    routeConstant: route.constant,
    routePath: route.path,
    importedModules,
  }));
}

export function buildComponentRouteIndex(): RouteTarget[] {
  const routeFiles = listRouteFiles();
  const targets = new Map<string, RouteTarget>();

  for (const routeFile of routeFiles) {
    const matches = parseRouteFile(routeFile);
    for (const match of matches) {
      if (!match.routePath) {
        continue;
      }

      const { hints, tabSegment } = buildInteractionHints(match.routePath);
      const key = `${match.routePath}::${match.routeFile}`;
      targets.set(key, {
        routePath: match.routePath,
        routeConstant: match.routeConstant,
        routeFile,
        matchedComponents: [...match.importedModules],
        interactionHints: hints,
        tabSegment,
      });
    }
  }

  return [...targets.values()];
}

export function findRoutesForChangedFiles(changedFiles: string[]): RouteTarget[] {
  const index = buildComponentRouteIndex();
  const matchedTargets = new Map<string, RouteTarget>();

  for (const changedFile of changedFiles) {
    const absoluteChanged = path.isAbsolute(changedFile)
      ? changedFile
      : path.join(REPO_ROOT, changedFile);

    for (const target of index) {
      const componentMatch = target.matchedComponents.some((importPath) =>
        fileMatchesImport(absoluteChanged, importPath),
      );

      if (componentMatch) {
        const key = `${target.routePath}::${target.routeFile}`;
        const existing = matchedTargets.get(key);
        if (existing) {
          existing.matchedComponents.push(absoluteChanged);
        } else {
          matchedTargets.set(key, {
            ...target,
            matchedComponents: [absoluteChanged],
          });
        }
      }
    }
  }

  return [...matchedTargets.values()];
}

export function getKnownPaths(): Map<string, string> {
  return parsePathsFile();
}
