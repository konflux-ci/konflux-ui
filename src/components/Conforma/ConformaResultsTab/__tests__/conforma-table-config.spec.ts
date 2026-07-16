import { CONFORMA_RESULT_STATUS, type ConformaResultRow } from '~/types/conforma';
import { filterConfigs } from '../conforma-table-config';

const createRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Default rule',
  description: 'Description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  msg: 'Test message',
  images: [],
  ...overrides,
});

describe('conforma-table-config filterConfigs', () => {
  const searchConfig = filterConfigs[0];
  const statusConfig = filterConfigs[1];

  describe('search filterFn', () => {
    const filterFn = searchConfig.filterFn;

    it('matches by code', () => {
      const row = createRow({ code: 'cve_scan.missing', title: 'Missing CVE scan' });
      expect(filterFn(row, 'cve_scan')).toBe(true);
    });

    it('matches by title', () => {
      const row = createRow({ title: 'Missing CVE scan' });
      expect(filterFn(row, 'CVE')).toBe(true);
    });

    it('matches by component', () => {
      const row = createRow({ component: 'api-gateway' });
      expect(filterFn(row, 'api-gate')).toBe(true);
    });

    it('returns false when nothing matches', () => {
      const row = createRow({ code: 'rule.a', title: 'Rule A', component: 'comp-1' });
      expect(filterFn(row, 'nonexistent')).toBe(false);
    });

    it('is case-insensitive', () => {
      const row = createRow({ title: 'Missing CVE scan' });
      expect(filterFn(row, 'missing cve')).toBe(true);
    });

    it('treats undefined code as empty string (no crash)', () => {
      const row = createRow({ code: undefined });
      expect(filterFn(row, 'undefined')).toBe(false);
    });
  });

  describe('status multiSelect filterFn', () => {
    const filterFn = statusConfig.filterFn;

    it('returns true when item status is in selected values', () => {
      const row = createRow({ status: CONFORMA_RESULT_STATUS.violations });
      expect(filterFn(row, [CONFORMA_RESULT_STATUS.violations])).toBe(true);
    });

    it('returns false when item status is not in selected values', () => {
      const row = createRow({ status: CONFORMA_RESULT_STATUS.successes });
      expect(filterFn(row, [CONFORMA_RESULT_STATUS.violations])).toBe(false);
    });

    it('works with multiple selected statuses', () => {
      const row = createRow({ status: CONFORMA_RESULT_STATUS.warnings });
      expect(
        filterFn(row, [CONFORMA_RESULT_STATUS.violations, CONFORMA_RESULT_STATUS.warnings]),
      ).toBe(true);
    });
  });
});
