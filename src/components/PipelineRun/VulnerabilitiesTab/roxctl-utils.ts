import type {
  RoxctlCveReport,
  RoxctlCveRow,
  RoxctlCveTableRow,
  RoxctlFlatCveEntry,
  RoxctlSeverity,
} from './types';

/**
 * Regex to extract the content of the `step-proccess-output` section from
 * a full Tekton Results log. Captures everything between the step header
 * and the next `step-` boundary (or end of string).
 *
 * The pattern uses `proccess` (double-c) because that is the upstream
 * Tekton task step name — not a typo in this regex.
 */
const STEP_PROCESS_OUTPUT_SECTION_REGEX =
  /step-proccess-output\s*:-[ \t]*\n?([\s\S]*?)(?=\n\s*step-[a-z]|$)/;

// Upstream step name is misspelled "proccess"; container is `step-proccess-output`.
const ROX_IMAGE_SCAN_ARCH_REGEX = /Scanning\s+(\S+)\s+image/gi;

/**
 * Finds the index just past the closing bracket/brace that matches the
 * opening bracket/brace at position 0 in `text`.
 *
 * Handles nested brackets, string escaping, and all valid JSON constructs.
 * Returns -1 if no matching close is found.
 */
const findJsonEnd = (text: string, open: string, close: string): number => {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
};

/**
 * Returns true for JSON objects that are metadata emitted by the roxctl
 * task (e.g. `{"image": {...}}` or `{"images-processed": N}`) and should
 * be excluded from the CVE report list.
 */
const isMetadataBlob = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  ('image' in value || 'images-processed' in value);

/**
 * Extracts all top-level JSON values (arrays or objects) from `text`,
 * skipping metadata blobs. For multi-arch builds the proccess-output step
 * emits one CVE report per architecture, so there may be several blobs.
 */
const extractAllJsonBlobs = (
  text: string,
): (RoxctlCveReport | RoxctlFlatCveEntry[])[] => {
  const results: (RoxctlCveReport | RoxctlFlatCveEntry[])[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const trimmed = remaining.trimStart();
    if (!trimmed.length) break;

    const arrayIdx = trimmed.indexOf('[');
    const objectIdx = trimmed.indexOf('{');

    if (arrayIdx === -1 && objectIdx === -1) break;

    let startIdx: number;
    let open: string;
    let close: string;

    if (arrayIdx === -1) {
      startIdx = objectIdx;
      open = '{';
      close = '}';
    } else if (objectIdx === -1) {
      startIdx = arrayIdx;
      open = '[';
      close = ']';
    } else if (arrayIdx < objectIdx) {
      startIdx = arrayIdx;
      open = '[';
      close = ']';
    } else {
      startIdx = objectIdx;
      open = '{';
      close = '}';
    }

    const sub = trimmed.slice(startIdx);
    const end = findJsonEnd(sub, open, close);
    if (end <= 0) break;

    try {
      const parsed: unknown = JSON.parse(sub.slice(0, end));
      if (!isMetadataBlob(parsed)) {
        results.push(parsed as RoxctlCveReport | RoxctlFlatCveEntry[]);
      }
    } catch {
      // Skip malformed JSON fragments
    }

    remaining = trimmed.slice(startIdx + end);
  }

  return results;
};

/**
 * Extracts the CVE data from the `step-proccess-output` section of a
 * Tekton Results log. Supports two formats:
 *
 * 1. **Flat array** (production `parse_to_cve_oriented_output.jq`):
 *    `[{ cve, severity, components: [{ component, version, source }] }, ...]`
 *
 * 2. **Nested object** (StackRox API / alternative jq):
 *    `{ id, name, scan: { components: [{ name, version, vulns: [...] }] } }`
 *
 * Multi-arch builds emit one blob per architecture; the function returns
 * all of them so each can be paired with its `imagePlatform`.
 */
export const extractCveReportFromTaskRunLogs = (
  logs: string,
): (RoxctlCveReport | RoxctlFlatCveEntry[])[] => {
  const sectionMatch = logs.match(STEP_PROCESS_OUTPUT_SECTION_REGEX);
  if (!sectionMatch?.[1]) {
    throw new Error('No valid roxctl CVE report JSON found in TaskRun logs');
  }

  const results = extractAllJsonBlobs(sectionMatch[1]);
  if (results.length === 0) {
    throw new Error('No valid roxctl CVE report JSON found in TaskRun logs');
  }
  return results;
};

/**
 * Extracts CVE data from a raw KubeArchive container log (no step headers).
 * The log is the direct stdout of `step-proccess-output`, which contains
 * the CVE JSON followed by an `images-processed` JSON on a subsequent line.
 * Multi-arch builds produce multiple JSON blobs.
 */
export const extractCveReportFromRawLog = (
  log: string,
): (RoxctlCveReport | RoxctlFlatCveEntry[])[] => {
  const results = extractAllJsonBlobs(log);
  if (results.length === 0) {
    throw new Error('No valid roxctl CVE report JSON found in container log');
  }
  return results;
};

/**
 * Normalizes a roxctl scan architecture value to a platform label.
 *
 * The `rox-image-scan` step logs `Scanning {arch} image: ...` where `arch`
 * is a bare architecture (e.g. `amd64`). Konflux roxctl scans run on Linux
 * images, so we prefix with `linux/` to match OCI platform notation.
 */
export const formatImagePlatform = (architecture: string): string =>
  architecture.includes('/') ? architecture : `linux/${architecture}`;

/**
 * Extracts scanned image platform labels (e.g. `linux/amd64`) from roxctl scan logs.
 */
export const extractImagePlatformsFromLogs = (logs: string): string[] => {
  const platforms = new Set<string>();

  for (const match of logs.matchAll(ROX_IMAGE_SCAN_ARCH_REGEX)) {
    const architecture = match[1];
    if (architecture) {
      platforms.add(formatImagePlatform(architecture));
    }
  }

  return Array.from(platforms);
};

/**
 * Display value for the Image column: platform label when available, otherwise image ref.
 */
export const imageColumnValue = (row: {
  imagePlatform?: string;
  imageFullName?: string;
}): string | undefined => row.imagePlatform ?? row.imageFullName;

/**
 * Flattens a flat-array CVE report (production `parse_to_cve_oriented_output.jq`
 * format) into RoxctlCveRow entries, one per CVE + component pair.
 *
 * @param imagePlatform - Optional platform label (e.g. `linux/amd64`).
 */
export const flattenFlatCveEntries = (
  entries: RoxctlFlatCveEntry[],
  imagePlatform?: string,
): RoxctlCveRow[] =>
  entries.flatMap((entry) =>
    (entry.components ?? []).map((comp) => ({
      cve: entry.cve,
      severity: entry.severity ?? 'UNKNOWN',
      summary: entry.summary,
      link: entry.links?.[0],
      fixedBy: entry.fixedBy || undefined,
      componentName: comp.component,
      componentVersion: comp.version,
      componentSource: comp.source,
      imagePlatform,
    })),
  );

/**
 * Flattens a nested RoxctlCveReport into a flat array of RoxctlCveRow entries,
 * one per component + vulnerability pair.
 *
 * Components with no vulnerabilities are skipped.
 */
export const flattenCveReport = (
  report: RoxctlCveReport,
  imagePlatform?: string,
): RoxctlCveRow[] => {
  const components = report.scan?.components ?? [];
  const imageFullName = report.name?.fullName;

  return components.flatMap((component) =>
    (component.vulns ?? []).map((vuln) => ({
      cve: vuln.cve,
      severity: vuln.severity ?? 'UNKNOWN',
      summary: vuln.summary,
      link: vuln.link,
      fixedBy: vuln.fixedBy || undefined,
      publishedOn: vuln.publishedOn,
      lastModified: vuln.lastModified,
      componentName: component.name,
      componentVersion: component.version,
      componentSource: component.source,
      imagePlatform,
      imageFullName,
    })),
  );
};

/**
 * Unified function: takes an array of reports (one per architecture) and
 * pairs each with its `imagePlatform` before flattening into RoxctlCveRow[].
 */
export const toRows = (
  reports: (RoxctlCveReport | RoxctlFlatCveEntry[])[],
  imagePlatforms: string[] = [],
): RoxctlCveRow[] =>
  reports.flatMap((data, index) => {
    const imagePlatform = imagePlatforms[index];
    if (Array.isArray(data)) {
      return flattenFlatCveEntries(data, imagePlatform);
    }
    return flattenCveReport(data, imagePlatform);
  });

/**
 * Numeric severity weight for sorting: higher = more severe.
 */
const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 5,
  CRITICAL_VULNERABILITY_SEVERITY: 5,
  HIGH: 4,
  IMPORTANT_VULNERABILITY_SEVERITY: 4,
  MEDIUM: 3,
  MODERATE_VULNERABILITY_SEVERITY: 3,
  LOW: 2,
  LOW_VULNERABILITY_SEVERITY: 2,
  NONE: 1,
  UNKNOWN: 0,
  UNKNOWN_VULNERABILITY_SEVERITY: 0,
};

/**
 * Returns a numeric weight for the given severity, suitable for sorting.
 * Higher values are more severe.
 */
export const severityWeight = (severity: RoxctlSeverity): number =>
  SEVERITY_WEIGHT[severity] ?? 0;

/**
 * Display label for a RoxctlSeverity value.
 * Maps both standard and StackRox-style severity names to Red Hat display labels.
 */
export const severityLabel = (severity: RoxctlSeverity): string => {
  switch (severity) {
    case 'CRITICAL':
    case 'CRITICAL_VULNERABILITY_SEVERITY':
      return 'Critical';
    case 'HIGH':
    case 'IMPORTANT_VULNERABILITY_SEVERITY':
      return 'Important';
    case 'MEDIUM':
    case 'MODERATE_VULNERABILITY_SEVERITY':
      return 'Moderate';
    case 'LOW':
    case 'LOW_VULNERABILITY_SEVERITY':
      return 'Low';
    case 'NONE':
      return 'None';
    default:
      return 'Unknown';
  }
};

/**
 * Groups flat `RoxctlCveRow[]` entries into one `RoxctlCveTableRow` per unique CVE.
 * When a CVE affects multiple packages, components are aggregated into the
 * `components` array. The first encountered row for each CVE sets the
 * severity, summary, link, fixedBy, and imageFullName.
 */
export const groupRowsByCve = (rows: RoxctlCveRow[]): RoxctlCveTableRow[] => {
  const grouped = new Map<string, RoxctlCveTableRow>();

  for (const row of rows) {
    const existing = grouped.get(row.cve);
    if (existing) {
      existing.components.push({
        name: row.componentName,
        version: row.componentVersion,
        source: row.componentSource,
      });
    } else {
      grouped.set(row.cve, {
        cve: row.cve,
        severity: row.severity,
        fixedBy: row.fixedBy,
        summary: row.summary,
        link: row.link,
        imagePlatform: row.imagePlatform,
        imageFullName: row.imageFullName,
        components: [
          {
            name: row.componentName,
            version: row.componentVersion,
            source: row.componentSource,
          },
        ],
      });
    }
  }

  return Array.from(grouped.values());
};
