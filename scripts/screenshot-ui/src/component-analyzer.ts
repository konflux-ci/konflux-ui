import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './constants.js';
import type { ComponentAnalysis, InteractivePattern, InteractivePatternType } from './types.js';

// ---------------------------------------------------------------------------
// Pattern detection rules
// ---------------------------------------------------------------------------
// Each rule checks both the import section and JSX usage. We require BOTH an
// import signal AND a JSX signal to reduce false positives (e.g. a file that
// only re-exports a type but never renders the component).

type PatternRule = {
  type: InteractivePatternType;
  /** At least one of these must match in the import block */
  importSignals: RegExp[];
  /** At least one of these must match anywhere in the file (JSX usage) */
  jsxSignals: RegExp[];
};

const PATTERN_RULES: PatternRule[] = [
  {
    type: 'popover',
    importSignals: [/\bPopover\b/, /HelpPopover/, /TruncatedLinkListWithPopover/],
    // Match <Popover at end-of-line (no trailing char) OR followed by whitespace//>
    jsxSignals: [
      /<Popover(?:[\s/>]|$)/m,
      /<HelpPopover(?:[\s/>]|$)/m,
      /<TruncatedLinkListWithPopover(?:[\s/>]|$)/m,
    ],
  },
  {
    type: 'modal',
    importSignals: [
      /\bModal\b/,
      /createModalLauncher/,
      /createRawModalLauncher/,
      /useModalLauncher/,
    ],
    jsxSignals: [
      /<Modal(?:[\s/>]|$)/m,
      /createModalLauncher\(/,
      /createRawModalLauncher\(/,
      /useModalLauncher\(/,
    ],
  },
  {
    type: 'tooltip',
    importSignals: [/\bTooltip\b/, /HelpTooltipIcon/, /ButtonWithAccessTooltip/],
    jsxSignals: [
      /<Tooltip(?:[\s/>]|$)/m,
      /<HelpTooltipIcon(?:[\s/>]|$)/m,
      /<ButtonWithAccessTooltip(?:[\s/>]|$)/m,
    ],
  },
  {
    type: 'expandable-section',
    importSignals: [/\bExpandableSection\b/],
    jsxSignals: [/<ExpandableSection(?:[\s/>]|$)/m],
  },
  {
    type: 'drawer',
    importSignals: [/\bDrawer\b/, /\bDrawerPanelContent\b/, /\bDrawerContent\b/],
    jsxSignals: [
      /<Drawer(?:[\s/>]|$)/m,
      /<DrawerPanelContent(?:[\s/>]|$)/m,
      /<DrawerContent(?:[\s/>]|$)/m,
    ],
  },
  {
    type: 'dropdown',
    importSignals: [/\bDropdown\b/, /\bBasicDropdown\b/, /\bMenuToggle\b/],
    jsxSignals: [
      /<Dropdown(?:[\s/>]|$)/m,
      /<BasicDropdown(?:[\s/>]|$)/m,
      /isOpen.*MenuToggle|MenuToggle.*isOpen/,
    ],
  },
];

// ---------------------------------------------------------------------------
// data-test extraction
// ---------------------------------------------------------------------------

function extractDataTestAttributes(content: string): string[] {
  const attrs = new Set<string>();

  // data-test="value"  or  data-test={'value'}  or  data-test={`value`}
  const patterns = [
    /data-test="([^"]+)"/g,
    /data-test='([^']+)'/g,
    /data-test=\{['"`]([^'"`]+)['"`]\}/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      attrs.add(match[1]);
    }
  }

  return [...attrs].sort();
}

// ---------------------------------------------------------------------------
// Interactive pattern detection
// ---------------------------------------------------------------------------

function extractImportBlock(content: string): string {
  // Grab all import statements (usually the first ~40 lines, but handle any size)
  const lines: string[] = [];
  let inImport = false;
  for (const line of content.split('\n')) {
    if (line.startsWith('import ')) {
      inImport = true;
    }
    if (inImport) {
      lines.push(line);
      // Multi-line imports end when we see the closing } or ;
      if (line.includes(';') || (line.includes('}') && !line.includes('{'))) {
        inImport = false;
      }
    }
  }
  return lines.join('\n');
}

/**
 * Try to find the data-test value closest to the JSX match for a pattern.
 * Searches a window of ~10 lines after each JSX element opening tag.
 */
function findNearbyDataTest(content: string, jsxSignal: RegExp): string | undefined {
  // Use the multiline flag version of the signal to find the char offset
  const multilineSignal = new RegExp(jsxSignal.source, 'm');
  const match = multilineSignal.exec(content);
  if (!match) return undefined;

  // Extract the next ~400 chars after the match (covers a few JSX props)
  const snippet = content.slice(match.index, match.index + 400);

  const m = snippet.match(/data-test="([^"]+)"/);
  if (m) return m[1];
  const m2 = snippet.match(/data-test=\{['"`]([^'"`]+)['"`]\}/);
  if (m2) return m2[1];

  return undefined;
}

function detectPatterns(content: string): InteractivePattern[] {
  const importBlock = extractImportBlock(content);
  const patterns: InteractivePattern[] = [];

  for (const rule of PATTERN_RULES) {
    const importMatches = rule.importSignals.some((re) => re.test(importBlock));
    if (!importMatches) continue;

    const matchingJsx = rule.jsxSignals.find((re) => re.test(content));
    if (!matchingJsx) continue;

    const dataTest = findNearbyDataTest(content, matchingJsx);
    patterns.push({ type: rule.type, ...(dataTest ? { dataTest } : {}) });
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// Git diff extraction
// ---------------------------------------------------------------------------

function getFileDiff(baseRef: string, headRef: string, filePath: string): string {
  try {
    return execSync(`git diff ${baseRef}...${headRef} -- ${filePath}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      // Keep diff output to a reasonable size; very large diffs are still useful
      maxBuffer: 1024 * 512,
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function analyzeComponent(
  filePath: string,
  baseRef: string,
  headRef: string,
): ComponentAnalysis {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);
  const content = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    file: filePath,
    interactivePatterns: detectPatterns(content),
    dataTestAttributes: extractDataTestAttributes(content),
    diff: getFileDiff(baseRef, headRef, filePath),
  };
}

export function analyzeComponents(
  files: string[],
  baseRef: string,
  headRef: string,
): ComponentAnalysis[] {
  return files.map((file) => analyzeComponent(file, baseRef, headRef));
}
