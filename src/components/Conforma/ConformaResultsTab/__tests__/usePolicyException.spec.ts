import { renderHook } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS, type ConformaResultRow } from '~/types/conforma';
import { usePolicyException } from '../usePolicyException';

const mockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'Test description',
  status: CONFORMA_RESULT_STATUS.warnings,
  component: 'test-component',
  images: [],
  ...overrides,
});

describe('usePolicyException', () => {
  it('returns warnings whose code is an upcoming policy change', () => {
    const expiring = mockRow({ code: 'volatile_config.expiring_rule' });
    const pending = mockRow({ code: 'volatile_config.pending_rule' });
    const results = [expiring, pending];

    const { result } = renderHook(() => usePolicyException(results));

    expect(result.current).toEqual([expiring, pending]);
  });

  it('excludes warnings whose code is not an upcoming policy change', () => {
    const results = [
      mockRow({ code: 'volatile_config.expiring_rule' }),
      mockRow({ code: 'some.other_rule' }),
    ];

    const { result } = renderHook(() => usePolicyException(results));

    expect(result.current).toEqual([results[0]]);
  });

  it('excludes warnings without a code', () => {
    const results = [mockRow({ code: undefined }), mockRow({ code: 'volatile_config.expired_rule' })];

    const { result } = renderHook(() => usePolicyException(results));

    expect(result.current).toEqual([results[1]]);
  });

  it('excludes rows that are not warnings even when the code matches', () => {
    const results = [
      mockRow({ status: CONFORMA_RESULT_STATUS.violations, code: 'volatile_config.expiring_rule' }),
      mockRow({ status: CONFORMA_RESULT_STATUS.successes, code: 'volatile_config.expiring_rule' }),
      mockRow({ status: CONFORMA_RESULT_STATUS.warnings, code: 'volatile_config.expiring_rule' }),
    ];

    const { result } = renderHook(() => usePolicyException(results));

    expect(result.current).toEqual([results[2]]);
  });

  it('returns an empty array when there are no policy exceptions', () => {
    const results = [
      mockRow({ status: CONFORMA_RESULT_STATUS.violations, code: 'some.rule' }),
      mockRow({ code: 'some.other_rule' }),
    ];

    const { result } = renderHook(() => usePolicyException(results));

    expect(result.current).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    const { result } = renderHook(() => usePolicyException([]));

    expect(result.current).toEqual([]);
  });

  it('returns a stable reference across re-renders when results are unchanged', () => {
    const results = [mockRow({ code: 'volatile_config.expiring_rule' })];

    const { result, rerender } = renderHook(({ rows }) => usePolicyException(rows), {
      initialProps: { rows: results },
    });

    const first = result.current;
    rerender({ rows: results });

    expect(result.current).toBe(first);
  });

  it('recomputes when the results reference changes', () => {
    const first = [mockRow({ code: 'volatile_config.expiring_rule' })];
    const second = [mockRow({ code: 'volatile_config.pending_rule' })];

    const { result, rerender } = renderHook(({ rows }) => usePolicyException(rows), {
      initialProps: { rows: first },
    });

    const firstResult = result.current;
    rerender({ rows: second });

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual(second);
  });
});
