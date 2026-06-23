import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { filterResults, groupByComponent, groupByRule } from '../conforma-grouping-utils';
import type { ConformaResultRow } from '../useApplicationConformaResults';

const mockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'Test description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  ...overrides,
});

describe('conforma-grouping-utils', () => {
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
