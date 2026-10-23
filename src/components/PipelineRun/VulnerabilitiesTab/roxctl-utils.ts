import { extractJsonValues } from '~/shared/utils/json-utils';
import type {
  RoxctlCveReport,
  RoxctlCveRow,
  RoxctlCveTableRow,
  RoxctlFlatCveEntry,
  RoxctlSeverity,
} from './types';

export const isRoxctlCveTableRow = (item: unknown): item is RoxctlCveTableRow => {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  if (!('cve' in item) || !('components' in item) || !('severity' in item)) {
    return false;
  }
  const { cve, components } = item;
  return typeof cve === 'string' && Array.isArray(components);
};

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
 * Extracts roxctl report JSON values from `text`, skipping metadata blobs.
 * Multi-arch builds emit one report per architecture, so there may be several
 * blobs.
 */
const extractAllJsonBlobs = (text: string): (RoxctlCveReport | RoxctlFlatCveEntry[])[] => {
  return extractJsonValues(text).filter(
    (value): value is RoxctlCveReport | RoxctlFlatCveEntry[] =>
      !isMetadataBlob(value) &&
      (Array.isArray(value) || (typeof value === 'object' && value !== null)),
  );
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
 * Normalizes either supported roxctl CVE report format into table rows, one
 * per CVE + component pair. Components with no vulnerabilities are skipped.
 */
export const flattenCveData = (
  data: RoxctlCveReport | RoxctlFlatCveEntry[],
  imagePlatform?: string,
): RoxctlCveRow[] => {
  if (Array.isArray(data)) {
    return data.flatMap((entry) =>
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
  }

  const report = data;
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
 * @deprecated Use flattenCveData() for either supported report format.
 */
export const flattenFlatCveEntries = (
  entries: RoxctlFlatCveEntry[],
  imagePlatform?: string,
): RoxctlCveRow[] => flattenCveData(entries, imagePlatform);

/**
 * @deprecated Use flattenCveData() for either supported report format.
 */
export const flattenCveReport = (report: RoxctlCveReport, imagePlatform?: string): RoxctlCveRow[] =>
  flattenCveData(report, imagePlatform);

/**
 * Unified function: takes an array of reports (one per architecture) and
 * pairs each with its `imagePlatform` before flattening into RoxctlCveRow[].
 */
export const toRows = (
  reports: (RoxctlCveReport | RoxctlFlatCveEntry[])[],
  imagePlatforms: string[] = [],
): RoxctlCveRow[] => reports.flatMap((data, index) => flattenCveData(data, imagePlatforms[index]));

/**
 * Numeric severity weight for sorting: higher = more severe.
 */
const SEVERITY_DETAILS: Record<RoxctlSeverity, { label: string; weight: number }> = {
  CRITICAL: { label: 'Critical', weight: 5 },
  CRITICAL_VULNERABILITY_SEVERITY: { label: 'Critical', weight: 5 },
  HIGH: { label: 'Important', weight: 4 },
  IMPORTANT_VULNERABILITY_SEVERITY: { label: 'Important', weight: 4 },
  MEDIUM: { label: 'Moderate', weight: 3 },
  MODERATE_VULNERABILITY_SEVERITY: { label: 'Moderate', weight: 3 },
  LOW: { label: 'Low', weight: 2 },
  LOW_VULNERABILITY_SEVERITY: { label: 'Low', weight: 2 },
  NONE: { label: 'None', weight: 1 },
  UNKNOWN: { label: 'Unknown', weight: 0 },
  UNKNOWN_VULNERABILITY_SEVERITY: { label: 'Unknown', weight: 0 },
};

/**
 * Returns a numeric weight for the given severity, suitable for sorting.
 * Higher values are more severe.
 */
export const severityWeight = (severity: RoxctlSeverity): number =>
  SEVERITY_DETAILS[severity]?.weight ?? 0;

/**
 * Display label for a RoxctlSeverity value.
 * Maps both standard and StackRox-style severity names to Red Hat display labels.
 */
export const severityLabel = (severity: RoxctlSeverity): string =>
  SEVERITY_DETAILS[severity]?.label ?? 'Unknown';

/**
 * Groups flat `RoxctlCveRow[]` entries into one `RoxctlCveTableRow` per unique CVE.
 * When a CVE affects multiple packages, components are aggregated into the
 * `components` array. The first encountered row for each CVE sets the
 * severity, summary, link, fixedBy, and imageFullName.
 */
export const groupRowsByCve = (rows: RoxctlCveRow[]): RoxctlCveTableRow[] => {
  const grouped = rows.reduce<Record<string, RoxctlCveTableRow>>((groupedRows, row) => {
    const existing = groupedRows[row.cve];
    if (existing) {
      existing.components.push({
        name: row.componentName,
        version: row.componentVersion,
        source: row.componentSource,
      });
    } else {
      groupedRows[row.cve] = {
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
      };
    }
    return groupedRows;
  }, {});

  return Object.values(grouped);
};
