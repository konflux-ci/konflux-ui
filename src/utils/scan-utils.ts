import { TektonResultsRun } from '../types';

export const SCAN_RESULT = 'CLAIR_SCAN_RESULT';
export const SCAN_RESULTS = 'CLAIR_SCAN_RESULTS';
export const CVE_SCAN_RESULT = 'CVE_SCAN_RESULT';
export const TEKTON_SCAN_RESULTS = 'TEKTON_SCAN_RESULTS';
export const SCAN_OUTPUT = 'SCAN_OUTPUT';

export const CVE_SCAN_RESULT_FIELDS = [
  SCAN_RESULT,
  SCAN_RESULTS,
  CVE_SCAN_RESULT,
  TEKTON_SCAN_RESULTS,
  SCAN_OUTPUT,
];

export const isCVEScanResult = (taskRunResults: TektonResultsRun) =>
  CVE_SCAN_RESULT_FIELDS.includes(taskRunResults?.name);

export type ScanResults = {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
};
