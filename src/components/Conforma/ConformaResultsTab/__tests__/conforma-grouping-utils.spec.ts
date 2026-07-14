import { CONFORMA_RESULT_STATUS, type ConformaResultRow } from '~/types/conforma';
import {
  collapseArchDuplicates,
  countResultsByStatus,
  filterResults,
  getCommonImageName,
  groupByComponent,
  groupByRule,
} from '../conforma-grouping-utils';

const mockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'Test description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  images: [],
  ...overrides,
});

describe('conforma-grouping-utils', () => {
  describe('countResultsByStatus', () => {
    it('counts violations, warnings, and successes', () => {
      const rows = [
        mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
        mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
        mockRow({ status: CONFORMA_RESULT_STATUS.warnings }),
        mockRow({ status: CONFORMA_RESULT_STATUS.successes }),
        mockRow({ status: CONFORMA_RESULT_STATUS.successes }),
        mockRow({ status: CONFORMA_RESULT_STATUS.successes }),
      ];

      expect(countResultsByStatus(rows)).toEqual({
        totalViolations: 2,
        totalWarnings: 1,
        totalSuccesses: 3,
      });
    });

    it('returns zero counts for empty input', () => {
      expect(countResultsByStatus([])).toEqual({
        totalViolations: 0,
        totalWarnings: 0,
        totalSuccesses: 0,
      });
    });
  });

  describe('groupByRule', () => {
    it('groups rows by title', () => {
      const rows = [
        mockRow({ title: 'Rule A', component: 'comp-1' }),
        mockRow({ title: 'Rule B', component: 'comp-2' }),
        mockRow({ title: 'Rule A', component: 'comp-3' }),
      ];

      const groups = groupByRule(rows);

      expect(groups).toHaveLength(2);
      expect(groups[0].groupKey).toBe('Rule A');
      expect(groups[0].rows).toHaveLength(2);
      expect(groups[1].groupKey).toBe('Rule B');
      expect(groups[1].rows).toHaveLength(1);
    });

    it('computes per-group violation/warning/success counts', () => {
      const rows = [
        mockRow({ title: 'Rule A', status: CONFORMA_RESULT_STATUS.violations }),
        mockRow({ title: 'Rule A', status: CONFORMA_RESULT_STATUS.warnings }),
        mockRow({ title: 'Rule A', status: CONFORMA_RESULT_STATUS.successes }),
        mockRow({ title: 'Rule A', status: CONFORMA_RESULT_STATUS.violations }),
      ];

      const groups = groupByRule(rows);

      expect(groups).toHaveLength(1);
      expect(groups[0].violations).toBe(2);
      expect(groups[0].warnings).toBe(1);
      expect(groups[0].successes).toBe(1);
    });

    it('returns empty array for empty input', () => {
      expect(groupByRule([])).toEqual([]);
    });

    it('uses code as primary group key when present, even when titles differ', () => {
      const rows = [
        mockRow({ code: 'rule.a', title: 'Rule Alpha (component 1)' }),
        mockRow({ code: 'rule.a', title: 'Rule Alpha (component 2)' }),
        mockRow({ code: 'rule.b', title: 'Rule Beta' }),
      ];

      const groups = groupByRule(rows);

      expect(groups).toHaveLength(2);
      expect(groups[0].groupKey).toBe('rule.a');
      expect(groups[0].rows).toHaveLength(2);
      expect(groups[1].groupKey).toBe('rule.b');
    });

    it('falls back to title when code is absent', () => {
      const rows = [
        mockRow({ title: 'Rule A', component: 'comp-1' }),
        mockRow({ title: 'Rule A', component: 'comp-2' }),
      ];

      const groups = groupByRule(rows);

      expect(groups).toHaveLength(1);
      expect(groups[0].groupKey).toBe('Rule A');
    });

    it('uses "Unknown rule" as fallback for rows with no title', () => {
      const rows = [mockRow({ title: undefined as unknown as string })];

      const groups = groupByRule(rows);

      expect(groups[0].groupKey).toBe('Unknown rule');
    });
  });

  describe('groupByComponent', () => {
    it('groups rows by component name', () => {
      const rows = [
        mockRow({ component: 'api-gateway', title: 'Rule A' }),
        mockRow({ component: 'auth-service', title: 'Rule B' }),
        mockRow({ component: 'api-gateway', title: 'Rule C' }),
      ];

      const groups = groupByComponent(rows);

      expect(groups).toHaveLength(2);
      expect(groups[0].groupKey).toBe('api-gateway');
      expect(groups[0].rows).toHaveLength(2);
      expect(groups[1].groupKey).toBe('auth-service');
      expect(groups[1].rows).toHaveLength(1);
    });

    it('computes per-group violation/warning/success counts', () => {
      const rows = [
        mockRow({ component: 'api', status: CONFORMA_RESULT_STATUS.violations }),
        mockRow({ component: 'api', status: CONFORMA_RESULT_STATUS.successes }),
        mockRow({ component: 'api', status: CONFORMA_RESULT_STATUS.successes }),
      ];

      const groups = groupByComponent(rows);

      expect(groups[0].violations).toBe(1);
      expect(groups[0].warnings).toBe(0);
      expect(groups[0].successes).toBe(2);
    });

    it('returns empty array for empty input', () => {
      expect(groupByComponent([])).toEqual([]);
    });

    it('uses "Unknown component" as fallback for rows with no component', () => {
      const rows = [mockRow({ component: undefined as unknown as string })];

      const groups = groupByComponent(rows);

      expect(groups[0].groupKey).toBe('Unknown component');
    });

    it('includes all known components even when they have zero results', () => {
      const rows = [mockRow({ component: 'api-gateway', title: 'Rule A' })];
      const allComponentNames = ['api-gateway', 'auth-service', 'cache-service'];

      const groups = groupByComponent(rows, allComponentNames);

      expect(groups).toHaveLength(3);
      const authGroup = groups.find((g) => g.groupKey === 'auth-service');
      expect(authGroup).toBeDefined();
      expect(authGroup?.rows).toHaveLength(0);
      expect(authGroup?.violations).toBe(0);
      expect(authGroup?.warnings).toBe(0);
      expect(authGroup?.successes).toBe(0);
    });

    it('preserves result rows for components that have data', () => {
      const rows = [
        mockRow({ component: 'api-gateway', status: CONFORMA_RESULT_STATUS.violations }),
      ];
      const allComponentNames = ['api-gateway', 'no-data-service'];

      const groups = groupByComponent(rows, allComponentNames);

      const apiGroup = groups.find((g) => g.groupKey === 'api-gateway');
      expect(apiGroup?.violations).toBe(1);
      expect(apiGroup?.rows).toHaveLength(1);
    });

    it('behaves like before when allComponentNames is not provided', () => {
      const rows = [
        mockRow({ component: 'api', status: CONFORMA_RESULT_STATUS.violations }),
      ];

      const groups = groupByComponent(rows);

      expect(groups).toHaveLength(1);
      expect(groups[0].groupKey).toBe('api');
    });
  });

  describe('collapseArchDuplicates', () => {
    it('merges rows with the same title, msg, component, and status but different images', () => {
      const rows = [
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'api', images: ['img@sha256:aaa'] }),
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'api', images: ['img@sha256:bbb'] }),
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'api', images: ['img@sha256:ccc'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['img@sha256:aaa', 'img@sha256:bbb', 'img@sha256:ccc']);
    });

    it('preserves distinct violations that differ in msg as separate rows', () => {
      const rows = [
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'api', images: ['img@sha256:aaa'] }),
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-002', component: 'api', images: ['img@sha256:bbb'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(2);
    });

    it('preserves distinct violations that differ in component as separate rows', () => {
      const rows = [
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'comp-a', images: ['img@sha256:aaa'] }),
        mockRow({ title: 'CVE rule', msg: 'CVE-2024-001', component: 'comp-b', images: ['img@sha256:bbb'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(2);
    });

    it('sets images array with all unique digests', () => {
      const rows = [
        mockRow({ images: ['img@sha256:111'] }),
        mockRow({ images: ['img@sha256:222'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result[0].images).toEqual(['img@sha256:111', 'img@sha256:222']);
    });

    it('deduplicates identical image digests', () => {
      const rows = [
        mockRow({ images: ['img@sha256:aaa'] }),
        mockRow({ images: ['img@sha256:aaa'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['img@sha256:aaa']);
    });

    it('returns the array unchanged when no duplicates exist', () => {
      const rows = [
        mockRow({ title: 'Rule A', component: 'comp-1', images: ['img@sha256:111'] }),
        mockRow({ title: 'Rule B', component: 'comp-2', images: ['img@sha256:222'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(2);
      expect(result[0].images).toEqual(['img@sha256:111']);
      expect(result[1].images).toEqual(['img@sha256:222']);
    });

    it('handles rows with no image gracefully', () => {
      const rows = [
        mockRow({ images: [] }),
        mockRow({ images: [] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual([]);
    });

    it('returns an empty array for empty input', () => {
      expect(collapseArchDuplicates([])).toEqual([]);
    });

    it('combines differing description and solution text instead of dropping them', () => {
      const rows = [
        mockRow({
          title: 'CVE rule',
          component: 'api',
          description: 'Description for arm64',
          solution: 'Solution for arm64',
          images: ['img@sha256:arm64'],
        }),
        mockRow({
          title: 'CVE rule',
          component: 'api',
          description: 'Description for amd64',
          solution: 'Solution for amd64',
          images: ['img@sha256:amd64'],
        }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Description for arm64\nDescription for amd64');
      expect(result[0].solution).toBe('Solution for arm64\nSolution for amd64');
    });

    it('seeds single-image rows with a one-element images array', () => {
      const rows = [mockRow({ images: ['img@sha256:only'] })];

      const result = collapseArchDuplicates(rows);

      expect(result[0].images).toEqual(['img@sha256:only']);
    });

    it('merges rows sharing the same code and real component name once arch-specific EC names are normalized', () => {
      const rows = [
        mockRow({
          code: 'cve_scan.missing',
          title: 'Missing CVE scan (image arm64)',
          msg: 'CVE scan is missing',
          component: 'comp-a',
          images: ['img@sha256:arm64'],
        }),
        mockRow({
          code: 'cve_scan.missing',
          title: 'Missing CVE scan (image amd64)',
          msg: 'CVE scan is missing',
          component: 'comp-a',
          images: ['img@sha256:amd64'],
        }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['img@sha256:arm64', 'img@sha256:amd64']);
      expect(result[0].title).toBe('Missing CVE scan');
    });

    it('does not merge rows with the same title but different code', () => {
      const rows = [
        mockRow({
          code: 'rule.a',
          title: 'Same Title',
          msg: 'same msg',
          component: 'comp-a',
          images: ['img@sha256:aaa'],
        }),
        mockRow({
          code: 'rule.b',
          title: 'Same Title',
          msg: 'same msg',
          component: 'comp-a',
          images: ['img@sha256:bbb'],
        }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(2);
    });

    it('collapses rows where msg is undefined using empty-string sentinel', () => {
      const rows: ConformaResultRow[] = [
        mockRow({ title: 'rule', msg: undefined, component: 'comp', images: ['img@sha256:aaa'] }),
        mockRow({ title: 'rule', msg: undefined, component: 'comp', images: ['img@sha256:bbb'] }),
      ];

      const result = collapseArchDuplicates(rows);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['img@sha256:aaa', 'img@sha256:bbb']);
    });
  });

  describe('getCommonImageName', () => {
    it('returns the shared repo prefix when all images share the same name', () => {
      expect(
        getCommonImageName([
          'quay.io/org/img@sha256:aaa',
          'quay.io/org/img@sha256:bbb',
          'quay.io/org/img@sha256:ccc',
        ]),
      ).toBe('quay.io/org/img');
    });

    it('returns undefined when images have different repo names', () => {
      expect(
        getCommonImageName([
          'quay.io/org/img-a@sha256:aaa',
          'quay.io/org/img-b@sha256:bbb',
        ]),
      ).toBeUndefined();
    });

    it('returns undefined for an empty array', () => {
      expect(getCommonImageName([])).toBeUndefined();
    });

    it('returns the full string when images have no @ separator', () => {
      expect(getCommonImageName(['quay.io/org/img', 'quay.io/org/img'])).toBe(
        'quay.io/org/img',
      );
    });

    it('returns the name for a single-element array', () => {
      expect(getCommonImageName(['quay.io/org/img@sha256:only'])).toBe('quay.io/org/img');
    });
  });

  describe('filterResults', () => {
    const sampleRows = [
      mockRow({
        title: 'Missing CVE scan',
        component: 'api-gateway',
        status: CONFORMA_RESULT_STATUS.violations,
      }),
      mockRow({
        title: 'Base image allowed',
        component: 'auth-service',
        status: CONFORMA_RESULT_STATUS.successes,
      }),
      mockRow({
        title: 'Deprecated API usage',
        component: 'api-gateway',
        status: CONFORMA_RESULT_STATUS.warnings,
      }),
    ];

    it('returns all rows when no filters are applied', () => {
      expect(filterResults(sampleRows, '', [])).toHaveLength(3);
    });

    it('filters by search text matching title', () => {
      const results = filterResults(sampleRows, 'CVE', []);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Missing CVE scan');
    });

    it('filters by search text matching component (case-insensitive)', () => {
      const results = filterResults(sampleRows, 'AUTH', []);
      expect(results).toHaveLength(1);
      expect(results[0].component).toBe('auth-service');
    });

    it('filters by status array', () => {
      const results = filterResults(sampleRows, '', [CONFORMA_RESULT_STATUS.violations]);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(CONFORMA_RESULT_STATUS.violations);
    });

    it('filters by multiple statuses', () => {
      const results = filterResults(sampleRows, '', [
        CONFORMA_RESULT_STATUS.violations,
        CONFORMA_RESULT_STATUS.warnings,
      ]);
      expect(results).toHaveLength(2);
    });

    it('combines search text and status filters', () => {
      const results = filterResults(sampleRows, 'api-gateway', [
        CONFORMA_RESULT_STATUS.violations,
      ]);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Missing CVE scan');
    });

    it('returns empty array when nothing matches', () => {
      expect(filterResults(sampleRows, 'nonexistent', [])).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      expect(filterResults([], 'test', [])).toHaveLength(0);
    });
  });
});
