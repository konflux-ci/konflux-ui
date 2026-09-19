import {
  extractCveReportFromRawLog,
  extractCveReportFromTaskRunLogs,
  extractImagePlatformsFromLogs,
  flattenCveReport,
  flattenFlatCveEntries,
  formatImagePlatform,
  groupRowsByCve,
  imageColumnValue,
  severityLabel,
  severityWeight,
  toRows,
} from '../roxctl-utils';
import type { RoxctlCveReport, RoxctlFlatCveEntry, RoxctlSeverity } from '../types';

const sampleReport: RoxctlCveReport = {
  id: 'sha256:abc123',
  name: {
    registry: 'quay.io',
    remote: 'redhat/test-image',
    tag: 'latest',
    fullName: 'quay.io/redhat/test-image:latest',
  },
  components: 2,
  cves: 3,
  fixableCves: 1,
  scan: {
    scanTime: '2024-06-15T10:00:00Z',
    components: [
      {
        name: 'openssl',
        version: '1.1.1k',
        source: 'OS',
        vulns: [
          {
            cve: 'CVE-2024-0001',
            severity: 'CRITICAL' as const,
            summary: 'Critical OpenSSL vulnerability',
            link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-0001',
            fixedBy: '1.1.1l',
            publishedOn: '2024-01-15T00:00:00Z',
            lastModified: '2024-03-02T00:00:00Z',
          },
          {
            cve: 'CVE-2024-0002',
            severity: 'MEDIUM' as const,
            summary: 'Medium OpenSSL issue',
            link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-0002',
          },
        ],
      },
      {
        name: 'nodejs',
        version: '18.0.0',
        source: 'NODEJS',
        vulns: [
          {
            cve: 'CVE-2024-0003',
            severity: 'HIGH' as const,
            summary: 'High severity Node.js vulnerability',
            link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-0003',
            fixedBy: '18.0.1',
            publishedOn: '2024-02-01T00:00:00Z',
            lastModified: '2024-04-10T00:00:00Z',
          },
        ],
      },
      {
        name: 'curl',
        version: '7.80.0',
        source: 'OS',
        vulns: [],
      },
    ],
  },
};

const sampleFlatEntries: RoxctlFlatCveEntry[] = [
  {
    cve: 'CVE-2021-20197',
    advisory: [],
    summary: 'There is an open race window when writing output...',
    links: ['https://access.redhat.com/security/cve/CVE-2021-20197'],
    fixedBy: '',
    severity: 'MODERATE_VULNERABILITY_SEVERITY',
    components: [
      { component: 'binutils-gold', version: '2.35.2-72.el9', source: 'var/lib/rpm' },
      { component: 'binutils', version: '2.35.2-72.el9', source: 'var/lib/rpm' },
    ],
  },
  {
    cve: 'CVE-2021-3115',
    advisory: [],
    summary: 'A flaw was found in golang...',
    links: ['https://access.redhat.com/security/cve/CVE-2021-3115'],
    fixedBy: '1.15.14',
    severity: 'IMPORTANT_VULNERABILITY_SEVERITY',
    components: [{ component: 'golang', version: '1.14.0', source: 'var/lib/rpm' }],
  },
];

describe('extractCveReportFromTaskRunLogs', () => {
  describe('flat array format (production)', () => {
    it('extracts the JSON array from a typical Tekton Results log', () => {
      const logs = [
        'step-rox-image-scan :-',
        'some scanning output...',
        '',
        'step-proccess-output :-',
        JSON.stringify(sampleFlatEntries),
        '{"image": {"pullspec": "quay.io/test:latest", "digests": ["sha256:abc"]}}',
        '',
        'step-conftest-vulnerabilities :-',
        'conftest output...',
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      const entries = result[0] as RoxctlFlatCveEntry[];
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toHaveLength(2);
      expect(entries[0].cve).toBe('CVE-2021-20197');
      expect(entries[0].components).toHaveLength(2);
      expect(entries[1].cve).toBe('CVE-2021-3115');
    });

    it('extracts JSON array when it is the last step (no trailing step boundary)', () => {
      const logs = [
        'step-proccess-output :-',
        JSON.stringify(sampleFlatEntries),
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0])).toBe(true);
      expect((result[0] as RoxctlFlatCveEntry[])).toHaveLength(2);
    });

    it('extracts pretty-printed JSON array from proccess-output', () => {
      const logs = [
        'step-proccess-output :-',
        JSON.stringify(sampleFlatEntries, null, 2),
        '{"image": {"pullspec": "quay.io/test:latest"}}',
        '',
        'step-conftest-vulnerabilities :-',
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0])).toBe(true);
      expect((result[0] as RoxctlFlatCveEntry[])[0].cve).toBe('CVE-2021-20197');
    });

    it('extracts multiple JSON arrays from a multi-arch log', () => {
      const archEntries: RoxctlFlatCveEntry[] = [
        {
          cve: 'CVE-2024-9999',
          severity: 'HIGH',
          components: [{ component: 'curl', version: '7.80.0' }],
        },
      ];

      const logs = [
        'step-proccess-output :-',
        JSON.stringify(sampleFlatEntries),
        '{"images-processed": 1}',
        JSON.stringify(archEntries),
        '{"images-processed": 2}',
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(2);
      expect((result[0] as RoxctlFlatCveEntry[])).toHaveLength(2);
      expect((result[1] as RoxctlFlatCveEntry[])).toHaveLength(1);
      expect((result[1] as RoxctlFlatCveEntry[])[0].cve).toBe('CVE-2024-9999');
    });

    it('does not truncate JSON when content contains step- text', () => {
      const entriesWithStepText: RoxctlFlatCveEntry[] = [
        {
          cve: 'CVE-2024-1234',
          severity: 'HIGH',
          summary: 'Failure in step-registry during build',
          components: [{ component: 'step-ca-bundle', version: '1.0' }],
        },
      ];

      const logs = [
        'step-proccess-output :-',
        JSON.stringify(entriesWithStepText),
        '',
        'step-conftest-vulnerabilities :-',
        'conftest output...',
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      const entries = result[0] as RoxctlFlatCveEntry[];
      expect(entries[0].cve).toBe('CVE-2024-1234');
      expect(entries[0].summary).toBe('Failure in step-registry during build');
      expect(entries[0].components?.[0].component).toBe('step-ca-bundle');
    });
  });

  describe('nested object format (legacy)', () => {
    it('extracts the JSON blob from a typical Tekton Results log', () => {
      const logs = [
        'step-rox-image-scan :-',
        'some scanning output...',
        '',
        'step-proccess-output :-',
        JSON.stringify(sampleReport),
        '',
        'step-oci-attach-report :-',
        'attaching artifacts...',
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      const report = result[0] as RoxctlCveReport;
      expect(report.id).toBe('sha256:abc123');
      expect(report.scan?.components).toHaveLength(3);
    });

    it('extracts JSON when it is the last step (no trailing step boundary)', () => {
      const logs = [
        'step-proccess-output :-',
        JSON.stringify(sampleReport),
      ].join('\n');

      const result = extractCveReportFromTaskRunLogs(logs);

      expect(result).toHaveLength(1);
      expect((result[0] as RoxctlCveReport).id).toBe('sha256:abc123');
    });
  });

  describe('error cases', () => {
    it('throws when no proccess-output step is found in logs', () => {
      const logs = [
        'step-rox-image-scan :-',
        'some scanning output...',
        'step-oci-attach-report :-',
        'attaching artifacts...',
      ].join('\n');

      expect(() => extractCveReportFromTaskRunLogs(logs)).toThrow(
        'No valid roxctl CVE report JSON found in TaskRun logs',
      );
    });

    it('throws when the proccess-output step contains no JSON', () => {
      const logs = [
        'step-proccess-output :-',
        'some non-json output',
        'step-oci-attach-report :-',
      ].join('\n');

      expect(() => extractCveReportFromTaskRunLogs(logs)).toThrow(
        'No valid roxctl CVE report JSON found in TaskRun logs',
      );
    });

    it('does not bleed into subsequent steps when proccess-output is empty', () => {
      const logs = [
        'step-proccess-output :-',
        '',
        'step-oci-attach-report :-',
        JSON.stringify([
          {
            cve: 'CVE-SHOULD-NOT-APPEAR',
            severity: 'HIGH',
            components: [{ component: 'pkg', version: '1.0' }],
          },
        ]),
      ].join('\n');

      expect(() => extractCveReportFromTaskRunLogs(logs)).toThrow(
        'No valid roxctl CVE report JSON found in TaskRun logs',
      );
    });

    it('throws on empty string input', () => {
      expect(() => extractCveReportFromTaskRunLogs('')).toThrow(
        'No valid roxctl CVE report JSON found in TaskRun logs',
      );
    });
  });
});

describe('extractCveReportFromRawLog', () => {
  it('extracts flat array from raw KubeArchive container log', () => {
    const rawLog = [
      JSON.stringify(sampleFlatEntries),
      '{"image": {"pullspec": "quay.io/test:latest"}}',
    ].join('\n');

    const result = extractCveReportFromRawLog(rawLog);

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0])).toBe(true);
    expect((result[0] as RoxctlFlatCveEntry[])).toHaveLength(2);
  });

  it('extracts multiple blobs from a multi-arch raw log', () => {
    const archEntries: RoxctlFlatCveEntry[] = [
      {
        cve: 'CVE-2024-9999',
        severity: 'HIGH',
        components: [{ component: 'curl', version: '7.80.0' }],
      },
    ];

    const rawLog = [
      JSON.stringify(sampleFlatEntries),
      '{"images-processed": 1}',
      JSON.stringify(archEntries),
      '{"images-processed": 2}',
    ].join('\n');

    const result = extractCveReportFromRawLog(rawLog);

    expect(result).toHaveLength(2);
    expect((result[0] as RoxctlFlatCveEntry[])).toHaveLength(2);
    expect((result[1] as RoxctlFlatCveEntry[])[0].cve).toBe('CVE-2024-9999');
  });

  it('throws when raw log contains no valid JSON', () => {
    expect(() => extractCveReportFromRawLog('not json at all')).toThrow(
      'No valid roxctl CVE report JSON found in container log',
    );
  });

  it('throws on empty string', () => {
    expect(() => extractCveReportFromRawLog('')).toThrow(
      'No valid roxctl CVE report JSON found in container log',
    );
  });
});

describe('formatImagePlatform', () => {
  it.each([
    { architecture: 'amd64', expected: 'linux/amd64' },
    { architecture: 'linux/arm64', expected: 'linux/arm64' },
  ])('maps $architecture to $expected', ({ architecture, expected }) => {
    expect(formatImagePlatform(architecture)).toBe(expected);
  });
});

describe('extractImagePlatformsFromLogs', () => {
  it('extracts platform labels from rox-image-scan step output', () => {
    const logs = [
      'step-rox-image-scan :-',
      'Scanning amd64 image: quay.io/test@sha256:abc',
      'step-proccess-output :-',
      JSON.stringify(sampleFlatEntries),
    ].join('\n');

    expect(extractImagePlatformsFromLogs(logs)).toEqual(['linux/amd64']);
  });

  it('returns unique platforms for multi-arch scans', () => {
    const logs = [
      'Scanning amd64 image: quay.io/test@sha256:abc',
      'Scanning arm64 image: quay.io/test@sha256:def',
    ].join('\n');

    expect(extractImagePlatformsFromLogs(logs)).toEqual(['linux/amd64', 'linux/arm64']);
  });
});

describe('flattenFlatCveEntries', () => {
  it('produces one row per CVE + component pair', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);

    expect(rows).toHaveLength(3);
  });

  it('attaches the image platform label when provided', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries, 'linux/amd64');

    expect(rows.every((row) => row.imagePlatform === 'linux/amd64')).toBe(true);
  });
});

describe('flattenFlatCveEntries fields', () => {

  it('maps fields correctly for a moderate severity CVE', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const moderate = rows.find(
      (r) => r.cve === 'CVE-2021-20197' && r.componentName === 'binutils-gold',
    );

    expect(moderate).toEqual(
      expect.objectContaining({
        cve: 'CVE-2021-20197',
        severity: 'MODERATE_VULNERABILITY_SEVERITY',
        summary: 'There is an open race window when writing output...',
        link: 'https://access.redhat.com/security/cve/CVE-2021-20197',
        componentName: 'binutils-gold',
        componentVersion: '2.35.2-72.el9',
        componentSource: 'var/lib/rpm',
      }),
    );
  });

  it('sets fixedBy to undefined when it is an empty string', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const row = rows.find((r) => r.cve === 'CVE-2021-20197');

    expect(row?.fixedBy).toBeUndefined();
  });

  it('preserves fixedBy when it is a non-empty string', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const row = rows.find((r) => r.cve === 'CVE-2021-3115');

    expect(row?.fixedBy).toBe('1.15.14');
  });

  it('returns empty array for empty input', () => {
    expect(flattenFlatCveEntries([])).toEqual([]);
  });
});

describe('flattenCveReport', () => {
  it('produces one row per component+vulnerability pair', () => {
    const rows = flattenCveReport(sampleReport);

    expect(rows).toHaveLength(3);
  });

  it('maps fields correctly for a critical vulnerability', () => {
    const rows = flattenCveReport(sampleReport);
    const critical = rows.find((r) => r.cve === 'CVE-2024-0001');

    expect(critical).toEqual(
      expect.objectContaining({
        cve: 'CVE-2024-0001',
        severity: 'CRITICAL',
        summary: 'Critical OpenSSL vulnerability',
        link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-0001',
        fixedBy: '1.1.1l',
        publishedOn: '2024-01-15T00:00:00Z',
        lastModified: '2024-03-02T00:00:00Z',
        componentName: 'openssl',
        componentVersion: '1.1.1k',
        componentSource: 'OS',
        imageFullName: 'quay.io/redhat/test-image:latest',
      }),
    );
  });

  it('maps fields correctly for a vulnerability with no fixedBy', () => {
    const rows = flattenCveReport(sampleReport);
    const medium = rows.find((r) => r.cve === 'CVE-2024-0002');

    expect(medium).toEqual(
      expect.objectContaining({
        cve: 'CVE-2024-0002',
        severity: 'MEDIUM',
        fixedBy: undefined,
        componentName: 'openssl',
      }),
    );
  });

  it('skips components with empty vulns array', () => {
    const rows = flattenCveReport(sampleReport);

    expect(rows.every((r) => r.componentName !== 'curl')).toBe(true);
  });

  it('skips components with no vulns property', () => {
    const reportNoVulns: RoxctlCveReport = {
      id: 'sha256:minimal',
      scan: {
        components: [{ name: 'clean-pkg', version: '1.0.0' }],
      },
    };

    const rows = flattenCveReport(reportNoVulns);

    expect(rows).toHaveLength(0);
  });

  it('returns empty array when scan has no components', () => {
    const emptyReport: RoxctlCveReport = {
      id: 'sha256:empty',
      scan: { components: [] },
    };

    expect(flattenCveReport(emptyReport)).toEqual([]);
  });

  it('returns empty array when scan is undefined', () => {
    const noScanReport: RoxctlCveReport = { id: 'sha256:noscan' };

    expect(flattenCveReport(noScanReport)).toEqual([]);
  });

  it('uses UNKNOWN when vuln has no severity', () => {
    const reportNoSeverity: RoxctlCveReport = {
      id: 'sha256:fallback',
      scan: {
        components: [{ name: 'some-lib', version: '2.0.0', vulns: [{ cve: 'CVE-2024-9999' }] }],
      },
    };

    const rows = flattenCveReport(reportNoSeverity);

    expect(rows).toHaveLength(1);
    expect(rows[0].severity).toBe('UNKNOWN');
  });

  it('preserves the imageFullName from the report name', () => {
    const rows = flattenCveReport(sampleReport);

    expect(rows.every((r) => r.imageFullName === 'quay.io/redhat/test-image:latest')).toBe(true);
  });

  it('sets imageFullName to undefined when report has no name', () => {
    const noNameReport: RoxctlCveReport = {
      id: 'sha256:noname',
      scan: {
        components: [{ name: 'lib', version: '1.0', vulns: [{ cve: 'CVE-TEST' }] }],
      },
    };

    const rows = flattenCveReport(noNameReport);

    expect(rows[0].imageFullName).toBeUndefined();
  });
});

describe('toRows', () => {
  it('delegates to flattenFlatCveEntries when given a flat array', () => {
    const rows = toRows([sampleFlatEntries]);

    expect(rows).toHaveLength(3);
    expect(rows[0].cve).toBe('CVE-2021-20197');
  });

  it('delegates to flattenCveReport when given a nested report', () => {
    const rows = toRows([sampleReport]);

    expect(rows).toHaveLength(3);
    expect(rows[0].cve).toBe('CVE-2024-0001');
  });

  it('pairs each report with its platform for multi-arch builds', () => {
    const archEntries: RoxctlFlatCveEntry[] = [
      {
        cve: 'CVE-2024-9999',
        severity: 'HIGH',
        components: [{ component: 'curl', version: '7.80.0' }],
      },
    ];

    const rows = toRows(
      [sampleFlatEntries, archEntries],
      ['linux/amd64', 'linux/arm64'],
    );

    const amd64Rows = rows.filter((r) => r.imagePlatform === 'linux/amd64');
    const arm64Rows = rows.filter((r) => r.imagePlatform === 'linux/arm64');

    expect(amd64Rows).toHaveLength(3);
    expect(arm64Rows).toHaveLength(1);
    expect(arm64Rows[0].cve).toBe('CVE-2024-9999');
  });

  it('handles reports without a matching platform', () => {
    const rows = toRows([sampleFlatEntries], []);

    expect(rows).toHaveLength(3);
    expect(rows[0].imagePlatform).toBeUndefined();
  });
});

describe('severityLabel', () => {
  it.each<[RoxctlSeverity, string]>([
    ['CRITICAL', 'Critical'],
    ['CRITICAL_VULNERABILITY_SEVERITY', 'Critical'],
    ['HIGH', 'Important'],
    ['IMPORTANT_VULNERABILITY_SEVERITY', 'Important'],
    ['MEDIUM', 'Moderate'],
    ['MODERATE_VULNERABILITY_SEVERITY', 'Moderate'],
    ['LOW', 'Low'],
    ['LOW_VULNERABILITY_SEVERITY', 'Low'],
    ['UNKNOWN', 'Unknown'],
    ['UNKNOWN_VULNERABILITY_SEVERITY', 'Unknown'],
    ['NONE', 'None'],
  ])('maps %s to "%s"', (severity, expected) => {
    expect(severityLabel(severity)).toBe(expected);
  });
});

describe('severityWeight', () => {
  it.each<[RoxctlSeverity, number]>([
    ['CRITICAL', 5],
    ['CRITICAL_VULNERABILITY_SEVERITY', 5],
    ['HIGH', 4],
    ['IMPORTANT_VULNERABILITY_SEVERITY', 4],
    ['MEDIUM', 3],
    ['MODERATE_VULNERABILITY_SEVERITY', 3],
    ['LOW', 2],
    ['LOW_VULNERABILITY_SEVERITY', 2],
    ['NONE', 1],
    ['UNKNOWN', 0],
    ['UNKNOWN_VULNERABILITY_SEVERITY', 0],
  ])('returns %i for %s', (severity, expected) => {
    expect(severityWeight(severity)).toBe(expected);
  });

  it('returns 0 for an unrecognised value', () => {
    expect(severityWeight('NOT_A_REAL_SEVERITY' as RoxctlSeverity)).toBe(0);
  });

  it('returns higher weight for more severe values', () => {
    expect(severityWeight('CRITICAL')).toBeGreaterThan(severityWeight('HIGH'));
    expect(severityWeight('HIGH')).toBeGreaterThan(severityWeight('MEDIUM'));
    expect(severityWeight('MEDIUM')).toBeGreaterThan(severityWeight('LOW'));
    expect(severityWeight('LOW')).toBeGreaterThan(severityWeight('UNKNOWN'));
  });

  it('treats StackRox-style names equally to standard names', () => {
    expect(severityWeight('CRITICAL_VULNERABILITY_SEVERITY')).toBe(severityWeight('CRITICAL'));
    expect(severityWeight('IMPORTANT_VULNERABILITY_SEVERITY')).toBe(severityWeight('HIGH'));
    expect(severityWeight('MODERATE_VULNERABILITY_SEVERITY')).toBe(severityWeight('MEDIUM'));
    expect(severityWeight('LOW_VULNERABILITY_SEVERITY')).toBe(severityWeight('LOW'));
  });
});

describe('imageColumnValue', () => {
  it('returns imagePlatform when both fields are set', () => {
    expect(
      imageColumnValue({ imagePlatform: 'linux/amd64', imageFullName: 'quay.io/test:latest' }),
    ).toBe('linux/amd64');
  });

  it('falls back to imageFullName when imagePlatform is absent', () => {
    expect(imageColumnValue({ imageFullName: 'quay.io/test:latest' })).toBe(
      'quay.io/test:latest',
    );
  });

  it('returns undefined when both fields are absent', () => {
    expect(imageColumnValue({})).toBeUndefined();
  });
});

describe('groupRowsByCve', () => {
  it('returns an empty array for empty input', () => {
    expect(groupRowsByCve([])).toEqual([]);
  });

  it('produces one entry per unique CVE', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const grouped = groupRowsByCve(rows);

    expect(grouped).toHaveLength(2);
    expect(grouped.map((r) => r.cve)).toEqual(['CVE-2021-20197', 'CVE-2021-3115']);
  });

  it('aggregates multiple components under the same CVE', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const grouped = groupRowsByCve(rows);

    const multiComp = grouped.find((r) => r.cve === 'CVE-2021-20197');

    expect(multiComp?.components).toHaveLength(2);
    expect(multiComp?.components.map((c) => c.name)).toEqual(['binutils-gold', 'binutils']);
  });

  it('preserves severity, summary, link, and fixedBy from the first row', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries);
    const grouped = groupRowsByCve(rows);

    const entry = grouped.find((r) => r.cve === 'CVE-2021-20197');

    expect(entry).toEqual(
      expect.objectContaining({
        severity: 'MODERATE_VULNERABILITY_SEVERITY',
        summary: 'There is an open race window when writing output...',
        link: 'https://access.redhat.com/security/cve/CVE-2021-20197',
        fixedBy: undefined,
      }),
    );
  });

  it('preserves imagePlatform from the first row', () => {
    const rows = flattenFlatCveEntries(sampleFlatEntries, 'linux/amd64');
    const grouped = groupRowsByCve(rows);

    expect(grouped.every((r) => r.imagePlatform === 'linux/amd64')).toBe(true);
  });

  it('keeps CVEs independent when they share no components', () => {
    const rows = flattenCveReport(sampleReport);
    const grouped = groupRowsByCve(rows);

    expect(grouped).toHaveLength(3);
    grouped.forEach((entry) => {
      expect(entry.components).toHaveLength(1);
    });
  });

  it('handles a single row with a single component', () => {
    const rows = flattenFlatCveEntries([sampleFlatEntries[1]]);
    const grouped = groupRowsByCve(rows);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].components).toHaveLength(1);
  });

  it('handles undefined componentSource', () => {
    const rows = flattenCveReport({
      id: 'sha256:test',
      scan: {
        components: [{ name: 'lib', version: '1.0', vulns: [{ cve: 'CVE-TEST', severity: 'LOW' }] }],
      },
    });
    const grouped = groupRowsByCve(rows);

    expect(grouped[0].components[0].source).toBeUndefined();
  });

  it('preserves insertion order of CVEs', () => {
    const rows = [
      ...flattenFlatCveEntries([{ cve: 'CVE-B', severity: 'HIGH', components: [{ component: 'pkg-b', version: '1.0' }] }]),
      ...flattenFlatCveEntries([{ cve: 'CVE-A', severity: 'LOW', components: [{ component: 'pkg-a', version: '1.0' }] }]),
      ...flattenFlatCveEntries([{ cve: 'CVE-C', severity: 'MEDIUM', components: [{ component: 'pkg-c', version: '1.0' }] }]),
    ];

    const grouped = groupRowsByCve(rows);

    expect(grouped.map((r) => r.cve)).toEqual(['CVE-B', 'CVE-A', 'CVE-C']);
  });

  it('maps component fields correctly', () => {
    const rows = flattenCveReport({
      id: 'sha256:test',
      scan: {
        components: [{ name: 'openssl', version: '3.0.5', source: 'OS', vulns: [{ cve: 'CVE-2024-FIELD', severity: 'HIGH' }] }],
      },
    });
    const grouped = groupRowsByCve(rows);

    expect(grouped[0].components[0]).toEqual({ name: 'openssl', version: '3.0.5', source: 'OS' });
  });

  it('copies imageFullName from the first row into the group', () => {
    const rows = flattenCveReport(sampleReport);
    const grouped = groupRowsByCve(rows);

    expect(grouped.every((r) => r.imageFullName === 'quay.io/redhat/test-image:latest')).toBe(true);
  });
});
