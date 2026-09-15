/**
 * TypeScript types for the roxctl image scan CVE-oriented report.
 *
 * The roxctl-scan Tekton task runs `roxctl image scan` and transforms the raw
 * protobuf JSON through `parse_to_cve_oriented_output.jq` into a CVE-oriented
 * structure. These types model that parsed output, which is emitted to stdout
 * by the `proccess-output` step and retrieved from the TaskRun logs.
 *
 * Schema reference: StackRox ImageService OpenAPI spec
 * https://raw.githubusercontent.com/api-evangelist/stackrox/refs/heads/main/openapi/stackrox-imageservice-api-openapi.yml
 */

export type RoxctlVulnerability = {
  cve: string;
  severity?: RoxctlSeverity;
  summary?: string;
  link?: string;
  fixedBy?: string;
  publishedOn?: string;
  lastModified?: string;
  vulnerabilityType?: string;
};

export type RoxctlComponentSource = 'OS' | 'PYTHON' | 'JAVA' | 'RUBY' | 'NODEJS';

export type RoxctlComponent = {
  name: string;
  version: string;
  license?: { name?: string; type?: string; url?: string };
  vulns?: RoxctlVulnerability[];
  layerIndex?: number;
  source?: RoxctlComponentSource;
  location?: string;
};

export type RoxctlImageName = {
  registry?: string;
  remote?: string;
  tag?: string;
  fullName?: string;
};

export type RoxctlScan = {
  scanTime?: string;
  components?: RoxctlComponent[];
};

export type RoxctlSeverity =
  | 'UNKNOWN'
  | 'NONE'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'UNKNOWN_VULNERABILITY_SEVERITY'
  | 'LOW_VULNERABILITY_SEVERITY'
  | 'MODERATE_VULNERABILITY_SEVERITY'
  | 'IMPORTANT_VULNERABILITY_SEVERITY'
  | 'CRITICAL_VULNERABILITY_SEVERITY';

/**
 * Top-level structure of a single architecture's CVE report as emitted by
 * the `proccess-output` step (after the jq transformation).
 *
 * The task runs once per architecture, so the full TaskRun log may contain
 * multiple RoxctlCveReport blobs (one per `tee` invocation).
 */
export type RoxctlCveReport = {
  id?: string;
  name?: RoxctlImageName;
  components?: number;
  cves?: number;
  fixableCves?: number;
  lastUpdated?: string;
  riskScore?: number;
  notes?: string[];
  scan?: RoxctlScan;
};

/**
 * Flat CVE entry as emitted by the production `parse_to_cve_oriented_output.jq`
 * transformation. The `proccess-output` step emits a JSON array of these entries.
 *
 * This is the format observed in real staging/production logs — a top-level array
 * of CVE objects, each containing its affected components inline.
 */
export type RoxctlFlatCveEntry = {
  cve: string;
  advisory?: Array<{ name?: string; link?: string }>;
  summary?: string;
  links?: string[];
  fixedBy?: string;
  severity: RoxctlSeverity;
  components: Array<{
    component: string;
    version: string;
    source?: string;
  }>;
};

/**
 * Grouped CVE row for table display: one row per unique CVE with all
 * affected components aggregated. Produced by `groupRowsByCve()`.
 */
export type RoxctlCveTableRow = {
  cve: string;
  severity: RoxctlSeverity;
  fixedBy?: string;
  summary?: string;
  link?: string;
  /** Target platform label for the Image column (e.g. `linux/amd64`). */
  imagePlatform?: string;
  imageFullName?: string;
  components: Array<{ name: string; version: string; source?: string }>;
};

/**
 * Parsed roxctl CVE reports plus image platform labels extracted from scan logs.
 *
 * Multi-arch builds produce one report per architecture. `reports[i]`
 * corresponds to `imagePlatforms[i]`.
 */
export type RoxctlCveReportResolution = {
  reports: (RoxctlCveReport | RoxctlFlatCveEntry[])[];
  imagePlatforms: string[];
};

/**
 * Flattened row for the CVE table: one entry per component + vulnerability pair.
 * Produced by `flattenCveReport()` or `flattenFlatCveEntries()`.
 */
export type RoxctlCveRow = {
  cve: string;
  severity: RoxctlSeverity;
  summary?: string;
  link?: string;
  fixedBy?: string;
  publishedOn?: string;
  lastModified?: string;
  componentName: string;
  componentVersion: string;
  componentSource?: string;
  imagePlatform?: string;
  imageFullName?: string;
};
