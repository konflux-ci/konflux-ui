import fs from 'node:fs';
import { PATHS_FILE } from './constants.js';

function normalizeSegment(segment: string): string {
  return segment.replace(/\$\{RouterParams\.(\w+)\}/g, '$1');
}

function parseExtendCalls(
  content: string,
): Array<{ name: string; parent: string; segment: string }> {
  const results: Array<{ name: string; parent: string; segment: string }> = [];
  const extendRegex =
    /export const (\w+)\s*(?::[^=]+)?=\s*(\w+)\.extend\(\s*\n?\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3\s*,?\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = extendRegex.exec(content)) !== null) {
    results.push({
      name: match[1],
      parent: match[2],
      segment: normalizeSegment(match[4].trim()),
    });
  }

  return results;
}

export function parsePathsFile(
  content: string = fs.readFileSync(PATHS_FILE, 'utf8'),
): Map<string, string> {
  const paths = new Map<string, string>();

  const buildRouteRegex = /export const (\w+)\s*(?::[^=]+)?=\s*buildRoute\(['"]([^'"]+)['"]\)/g;
  let match: RegExpExecArray | null;
  while ((match = buildRouteRegex.exec(content)) !== null) {
    paths.set(match[1], match[2]);
  }

  const extendCalls = parseExtendCalls(content);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { name, parent, segment } of extendCalls) {
      const parentPath = paths.get(parent);
      if (!parentPath) {
        continue;
      }
      const fullPath = `${parentPath}/${segment}`;
      if (paths.get(name) !== fullPath) {
        paths.set(name, fullPath);
        changed = true;
      }
    }
  }

  return paths;
}

export function resolvePathConstant(
  constantName: string,
  paths = parsePathsFile(),
): string | undefined {
  return paths.get(constantName);
}

export function extractRouteParams(routePath: string): string[] {
  return [...routePath.matchAll(/:(\w+)/g)].map(([, param]) => param);
}

export function buildUrlFromRoute(
  routePath: string,
  devServerUrl: string,
  params: Record<string, string>,
): string | undefined {
  const missing = extractRouteParams(routePath).filter((param) => !params[param]);
  if (missing.length > 0) {
    return undefined;
  }

  let resolved = routePath;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`:${key}`, encodeURIComponent(value));
  }

  return `${devServerUrl.replace(/\/$/, '')}/${resolved}`;
}
