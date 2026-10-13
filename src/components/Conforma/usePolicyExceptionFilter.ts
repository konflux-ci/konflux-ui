import * as React from 'react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { POLICY_EXCEPTION_RULE_CODES } from './policy-exception-utils';

/**
 * URL search param holding the policy exception rule codes the table is
 * narrowed to. Must be listed in the surrounding `FilterContextProvider`'s
 * `filterParams` for the filter to survive navigation and be shareable.
 */
export const POLICY_EXCEPTION_FILTER_KEY = 'ruleCode';

export type PolicyExceptionFilter = {
  /** Whether the "Show policy exceptions" toggle is on — derived from the URL. */
  isChecked: boolean;
  /**
   * Rule codes the table is narrowed to. Empty when the toggle is off, so this
   * doubles as the rule-filter argument for `filterResults`.
   */
  ruleCodes: string[];
  onChange: (checked: boolean) => void;
  onRuleCodesChange: (codes: string[]) => void;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? (value as string[]) : [];

/**
 * Shared "Show policy exceptions" filter for the Conforma tables.
 *
 * Switching the toggle writes the policy exception rule codes to the `ruleCode`
 * search param (alongside the Warning status) in a single update, and nothing
 * else: the table and the toolbar both read their state back out of the URL, so
 * a narrowed view is reloadable and shareable, and "Clear all filters" resets
 * the toggle for free because it unsets every managed param.
 *
 * The codes written are the full known set, independent of what the current
 * result set happens to contain — the filter describes what is being asked for,
 * not what matched. A table with no matching rows therefore shows its usual
 * empty state rather than the toggle silently doing nothing.
 */
export const usePolicyExceptionFilter = (): PolicyExceptionFilter => {
  const { filters, setFilters } = React.useContext(FilterContext);

  const ruleCodes = React.useMemo(
    () => toStringArray(filters[POLICY_EXCEPTION_FILTER_KEY]),
    [filters],
  );
  const statusFilter = React.useMemo(() => toStringArray(filters.status), [filters]);

  // Status selection to put back when the toggle is switched off again. Only a
  // convenience for the in-page round trip — on a freshly loaded URL there is
  // nothing to restore, so switching off simply clears the status filter.
  const statusBeforeToggle = React.useRef<string[]>([]);

  const onChange = React.useCallback(
    (checked: boolean) => {
      if (checked) {
        statusBeforeToggle.current = statusFilter;
      }
      setFilters({
        ...filters,
        [POLICY_EXCEPTION_FILTER_KEY]: checked ? [...POLICY_EXCEPTION_RULE_CODES] : [],
        status: checked ? [CONFORMA_RESULT_STATUS.warnings] : statusBeforeToggle.current,
      });
    },
    [filters, setFilters, statusFilter],
  );

  // Removing the last rule label would leave an empty table with no obvious way
  // back, so it switches the toggle off instead.
  const onRuleCodesChange = React.useCallback(
    (codes: string[]) => {
      if (codes.length === 0) {
        onChange(false);
        return;
      }
      setFilters({ ...filters, [POLICY_EXCEPTION_FILTER_KEY]: codes });
    },
    [filters, onChange, setFilters],
  );

  return React.useMemo(
    () => ({
      isChecked: ruleCodes.length > 0,
      ruleCodes,
      onChange,
      onRuleCodesChange,
    }),
    [ruleCodes, onChange, onRuleCodesChange],
  );
};
