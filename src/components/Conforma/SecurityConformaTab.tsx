import * as React from 'react';
import { Bullseye, Button, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL } from '~/consts/documentation';
import { useDeepCompareMemoize } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import { TaskRunKind } from '~/types';
import { CONFORMA_RESULT_STATUS, ConformaResultRow } from '~/types/conforma';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { FilterContext } from '../Filter/generic/FilterContext';
import { MultiSelect } from '../Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '../Filter/utils/filter-utils';
import { countResultsByStatus, filterResults } from './ConformaResultsTab/conforma-grouping-utils';
import { ConformaSummaryBar } from './ConformaResultsTab/ConformaSummaryBar';
import { ConformaTable } from './ConformaTable/ConformaTable';
import SecurityTabEmptyState from './SecurityTabEmptyState';
import { ShowPolicyExceptionsToggle } from './ShowPolicyExceptionsToggle';
import { useConformaResult } from './useConformaResult';
import { usePolicyExceptionFilter } from './usePolicyExceptionFilter';

const statuses = [
  CONFORMA_RESULT_STATUS.violations,
  CONFORMA_RESULT_STATUS.warnings,
  CONFORMA_RESULT_STATUS.successes,
];

/** Components scanned and how many of them have at least one violation. */
const getComponentTotals = (results: ConformaResultRow[]) => {
  const failedComponents = new Set<string>();
  const allComponents = new Set<string>();

  results.forEach((result) => {
    allComponents.add(result.component);
    if (result.status === CONFORMA_RESULT_STATUS.violations) {
      failedComponents.add(result.component);
    }
  });

  return { totalComponents: allComponents.size, totalFailed: failedComponents.size };
};

export const SecurityConformaTab: React.FC<
  React.PropsWithChildren<{ pipelineRunName: string; taskRun?: TaskRunKind }>
> = ({ pipelineRunName, taskRun }) => {
  const [conformaResult, crLoaded, crError] = useConformaResult(pipelineRunName, taskRun);
  const componentOptions = React.useMemo(
    () => Array.from(new Set(conformaResult?.map((cr) => cr.component) ?? [])),
    [conformaResult],
  );

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    rule: unparsedFilters.rule ? (unparsedFilters.rule as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    component: unparsedFilters.component ? (unparsedFilters.component as string[]) : [],
  });

  const { rule: ruleFilter, status: statusFilter, component: componentFilter } = filters;

  const statusFilterObj = React.useMemo(
    () =>
      crLoaded && conformaResult
        ? createFilterObj(conformaResult, (cr) => cr.status, statuses)
        : [],
    [conformaResult, crLoaded],
  );

  const componentFilterObj = React.useMemo(
    () =>
      crLoaded && conformaResult
        ? createFilterObj(conformaResult, (cr) => cr.component, componentOptions)
        : [],
    [conformaResult, crLoaded, componentOptions],
  );

  const policyExceptionFilter = usePolicyExceptionFilter();

  // Filter data in table, sharing ConformaResultsTab's filter so both tabs
  // narrow results the same way. The toggle contributes its matched rule codes
  // as just another filter array.
  const filteredCRResult = React.useMemo(() => {
    return crLoaded && conformaResult
      ? filterResults(
          conformaResult,
          ruleFilter,
          statusFilter,
          componentFilter,
          policyExceptionFilter.ruleCodes,
        )
      : undefined;
  }, [
    componentFilter,
    conformaResult,
    crLoaded,
    ruleFilter,
    statusFilter,
    policyExceptionFilter.ruleCodes,
  ]);

  // Result summary covers every evaluated rule, not just the filtered rows, so
  // the component totals keep their "scanned / failed" meaning while filters
  // narrow the table below.
  const resultCounts = React.useMemo(
    () => countResultsByStatus(conformaResult ?? []),
    [conformaResult],
  );

  const componentTotals = React.useMemo(
    () => getComponentTotals(conformaResult ?? []),
    [conformaResult],
  );

  const toolbar = (
    <BaseTextFilterToolbar
      text={ruleFilter}
      label="rule"
      setText={(rule) => setFilters({ ...filters, rule })}
      onClearFilters={onClearFilters}
      dataTest="security-conforma-list-toolbar"
    >
      <MultiSelect
        label="Component"
        values={componentFilter}
        filterKey="component"
        setValues={(component) => setFilters({ ...filters, component })}
        options={componentFilterObj}
      />
      <MultiSelect
        label="Status"
        values={statusFilter}
        filterKey="status"
        setValues={(status) => setFilters({ ...filters, status })}
        options={statusFilterObj}
      />
      <ShowPolicyExceptionsToggle filter={policyExceptionFilter} />
    </BaseTextFilterToolbar>
  );

  if (crError) {
    return getErrorState(crError, crLoaded, 'Conforma results');
  }

  if (!crLoaded && !filteredCRResult) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else if (crLoaded && !filteredCRResult) {
    return <SecurityTabEmptyState pipelineRunName={pipelineRunName} />;
  }

  return (
    <>
      <Content style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
        <Content component={ContentVariants.h3}>Testing apps against Conforma</Content>
        <Content component={ContentVariants.p}>
          Conforma is a set of tools for verifying the provenance of application snapshots and
          validating them against a clearly defined policy.
          <br />
          The Conforma policy is defined using the{' '}
          <Button
            variant="link"
            isInline
            component={(props) => (
              <a
                {...props}
                href="https://www.openpolicyagent.org/docs/latest/policy-language/"
                target="_blank"
                rel="noreferrer"
              />
            )}
          >
            rego policy language
          </Button>{' '}
          and is described here in{' '}
          <Button
            variant="link"
            isInline
            component={(props) => (
              <a
                {...props}
                href={CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL}
                target="_blank"
                rel="noreferrer"
              />
            )}
          >
            Conforma Policies
          </Button>
          .
        </Content>
      </Content>
      <div style={{ marginTop: 'var(--pf-t--global--spacer--xl)' }} data-test="result-summary">
        <ConformaSummaryBar
          totalComponents={componentTotals.totalComponents}
          totalFailed={componentTotals.totalFailed}
          totalViolations={resultCounts.totalViolations}
          totalWarnings={resultCounts.totalWarnings}
          totalSuccesses={resultCounts.totalSuccesses}
        />
      </div>
      <Content style={{ marginTop: 'var(--pf-t--global--spacer--xl)' }}>
        <Content component={ContentVariants.h3}>Results</Content>
      </Content>
      {toolbar}
      {crLoaded && filteredCRResult.length > 0 ? (
        <ConformaTable conformaResult={filteredCRResult} />
      ) : (
        <FilteredEmptyState onClearFilters={onClearFilters} />
      )}
    </>
  );
};
