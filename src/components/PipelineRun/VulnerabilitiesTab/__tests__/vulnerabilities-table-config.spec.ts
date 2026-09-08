import type { RoxctlCveTableRow } from '../types';
import {
  VULNERABILITIES_TABLE_COLUMNS,
  VULNERABILITIES_TABLE_COLUMN_STATE_KEY,
  vulnerabilitiesFilterConfigs,
  buildVulnerabilityFilterOptions,
} from '../vulnerabilities-table-config';

const makeTableRow = (overrides: Partial<RoxctlCveTableRow> = {}): RoxctlCveTableRow => ({
  cve: 'CVE-2024-0001',
  severity: 'CRITICAL',
  fixedBy: '1.0.1',
  summary: 'A critical vulnerability',
  link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-0001',
  imageFullName: 'quay.io/test:latest',
  components: [{ name: 'openssl', version: '1.0.0', source: 'OS' }],
  ...overrides,
});

describe('vulnerabilities-table-config', () => {
  describe('VULNERABILITIES_TABLE_COLUMN_STATE_KEY', () => {
    it('has a defined localStorage key', () => {
      expect(VULNERABILITIES_TABLE_COLUMN_STATE_KEY).toBe('vulnerabilities-table');
    });
  });

  describe('VULNERABILITIES_TABLE_COLUMNS', () => {
    it('defines expected column IDs', () => {
      const ids = VULNERABILITIES_TABLE_COLUMNS.map((col) => col.id);
      expect(ids).toEqual([
        'cveId',
        'severity',
        'package',
        'packageVersion',
        'componentSource',
        'fixedInVersion',
        'image',
      ]);
    });

    it('marks cveId as nonHidable', () => {
      const cveCol = VULNERABILITIES_TABLE_COLUMNS.find((c) => c.id === 'cveId');
      expect(cveCol?.nonHidable).toBe(true);
    });

    it.each(['cveId', 'severity', 'package', 'fixedInVersion'])(
      'marks %s as sortable',
      (colId) => {
        const col = VULNERABILITIES_TABLE_COLUMNS.find((c) => c.id === colId);
        expect(col?.sortable).toBe(true);
      },
    );

    it('hides componentSource below lg breakpoint', () => {
      const col = VULNERABILITIES_TABLE_COLUMNS.find((c) => c.id === 'componentSource');
      expect(col?.visibleFrom).toBe('lg');
    });

    it('hides image below xl breakpoint', () => {
      const col = VULNERABILITIES_TABLE_COLUMNS.find((c) => c.id === 'image');
      expect(col?.visibleFrom).toBe('xl');
    });
  });

  describe('vulnerabilitiesFilterConfigs', () => {
    it('defines a search filter for CVE ID', () => {
      const searchConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'cve');
      expect(searchConfig?.type).toBe('search');
    });

    it('defines multiSelect filters for package, severity, and image', () => {
      const multiSelects = vulnerabilitiesFilterConfigs.filter((c) => c.type === 'multiSelect');
      const params = multiSelects.map((c) => c.param);
      expect(params).toContain('package');
      expect(params).toContain('severity');
      expect(params).toContain('image');
    });

    it('CVE search filter matches by CVE ID', () => {
      const searchConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'cve');
      const row = makeTableRow({ cve: 'CVE-2024-21626' });
      expect(searchConfig?.filterFn?.(row, '21626')).toBe(true);
      expect(searchConfig?.filterFn?.(row, 'nomatch')).toBe(false);
    });

    it('severity filter matches normalized severity labels', () => {
      const severityConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'severity');
      const criticalRow = makeTableRow({ severity: 'CRITICAL' });
      const lowRow = makeTableRow({ severity: 'LOW' });

      expect(severityConfig?.filterFn?.(criticalRow, ['critical'])).toBe(true);
      expect(severityConfig?.filterFn?.(criticalRow, ['low'])).toBe(false);
      expect(severityConfig?.filterFn?.(lowRow, ['low'])).toBe(true);
    });

    it('severity filter matches StackRox-style severity names', () => {
      const severityConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'severity');
      const moderateRow = makeTableRow({ severity: 'MODERATE_VULNERABILITY_SEVERITY' });

      expect(severityConfig?.filterFn?.(moderateRow, ['moderate'])).toBe(true);
    });

    it('package filter matches any component name', () => {
      const packageConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'package');
      const row = makeTableRow({
        components: [
          { name: 'curl', version: '7.0', source: 'OS' },
          { name: 'libcurl', version: '7.0', source: 'OS' },
        ],
      });

      expect(packageConfig?.filterFn?.(row, ['libcurl'])).toBe(true);
      expect(packageConfig?.filterFn?.(row, ['openssl'])).toBe(false);
    });

    it('image filter matches imageFullName', () => {
      const imageConfig = vulnerabilitiesFilterConfigs.find((c) => c.param === 'image');
      const row = makeTableRow({ imageFullName: 'quay.io/test:latest' });

      expect(imageConfig?.filterFn?.(row, ['quay.io/test:latest'])).toBe(true);
      expect(imageConfig?.filterFn?.(row, ['other:latest'])).toBe(false);
    });
  });

  describe('buildVulnerabilityFilterOptions', () => {
    it('extracts unique package names sorted alphabetically', () => {
      const data = [
        makeTableRow({
          components: [
            { name: 'openssl', version: '1.0', source: 'OS' },
            { name: 'curl', version: '7.0', source: 'OS' },
          ],
        }),
        makeTableRow({ cve: 'CVE-2', components: [{ name: 'curl', version: '7.0' }] }),
      ];

      const options = buildVulnerabilityFilterOptions(data);

      expect(options.package.map((o) => o.value)).toEqual(['curl', 'openssl']);
    });

    it('extracts unique images sorted alphabetically', () => {
      const data = [
        makeTableRow({ imageFullName: 'quay.io/b:latest' }),
        makeTableRow({ cve: 'CVE-2', imageFullName: 'quay.io/a:latest' }),
        makeTableRow({ cve: 'CVE-3', imageFullName: 'quay.io/b:latest' }),
      ];

      const options = buildVulnerabilityFilterOptions(data);

      expect(options.image.map((o) => o.value)).toEqual([
        'quay.io/a:latest',
        'quay.io/b:latest',
      ]);
    });

    it('includes static severity options', () => {
      const options = buildVulnerabilityFilterOptions([]);

      expect(options.severity).toHaveLength(5);
      expect(options.severity.map((o) => o.value)).toEqual([
        'critical',
        'important',
        'moderate',
        'low',
        'unknown',
      ]);
    });

    it('omits undefined imageFullName from image options', () => {
      const data = [makeTableRow({ imageFullName: undefined })];

      const options = buildVulnerabilityFilterOptions(data);

      expect(options.image).toHaveLength(0);
    });
  });
});
