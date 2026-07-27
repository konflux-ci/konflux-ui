import * as React from 'react';
import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Spinner,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL } from '~/consts/documentation';
import { useDeepCompareMemoize } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import { CONFORMA_RESULT_STATUS, ConformaResultRow } from '~/types/conforma';
import { textMatch } from '~/utils/text-filter-utils';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { FilterContext } from '../Filter/generic/FilterContext';
import { MultiSelect } from '../Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '../Filter/utils/filter-utils';
import { ConformaTable } from './ConformaTable/ConformaTable';
import SecurityTabEmptyState from './SecurityTabEmptyState';
import { useConformaResult } from './useConformaResult';
import { getRuleStatus } from './utils';

const statuses = [
  CONFORMA_RESULT_STATUS.violations,
  CONFORMA_RESULT_STATUS.warnings,
  CONFORMA_RESULT_STATUS.successes,
];

const getResultsSummary = (CRs, crLoaded) => {
  const statusFilter = Object.fromEntries(statuses.map((status) => [status, 0]));
  return crLoaded && CRs
    ? CRs?.reduce((acc, cr) => {
        if (acc[cr.status]) {
          acc[cr.status] += 1;
        } else {
          acc[cr.status] = 1;
        }
        return acc;
      }, statusFilter)
    : statusFilter;
};

export const SecurityConformaTab: React.FC<
  React.PropsWithChildren<{ pipelineRunName: string }>
> = ({ pipelineRunName }) => {
  const [conformaResult, crLoaded, crError] = useConformaResult(pipelineRunName);
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

  // filter data in table
  const filteredCRResult = React.useMemo(() => {
    return crLoaded && conformaResult
      ? conformaResult?.filter((rule: ConformaResultRow) => {
          return (
            textMatch(rule.title, ruleFilter) &&
            (!statusFilter.length || statusFilter.includes(rule.status)) &&
            (!componentFilter.length || componentFilter.includes(rule.component))
          );
        })
      : undefined;
  }, [componentFilter, conformaResult, crLoaded, ruleFilter, statusFilter]);

  // result summary
  const resultSummary = React.useMemo(
    () => getResultsSummary(filteredCRResult, crLoaded),
    [filteredCRResult, crLoaded],
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
    return <SecurityTabEmptyState />;
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
      <Flex style={{ marginTop: 'var(--pf-t--global--spacer--xl)' }}>
        <FlexItem style={{ marginRight: 'var(--pf-t--global--spacer--2xl)' }}>
          <Content>
            <Content component={ContentVariants.h3}>Results</Content>
          </Content>
          {toolbar}
        </FlexItem>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Content>
              <Content component={ContentVariants.h3}>Results summary</Content>
            </Content>
          </FlexItem>
          <Flex data-test="result-summary" spaceItems={{ default: 'spaceItemsXl' }}>
            <FlexItem spacer={{ default: 'spacerXl' }}>
              <span style={{ marginRight: 'var(--pf-t--global--spacer--sm)' }}>
                {getRuleStatus(CONFORMA_RESULT_STATUS.violations)}
              </span>
              <b>{resultSummary[CONFORMA_RESULT_STATUS.violations]}</b>
            </FlexItem>
            <FlexItem>
              <span style={{ marginRight: 'var(--pf-t--global--spacer--sm)' }}>
                {getRuleStatus(CONFORMA_RESULT_STATUS.warnings)}
              </span>
              <b>{resultSummary[CONFORMA_RESULT_STATUS.warnings]}</b>
            </FlexItem>
            <FlexItem>
              <span style={{ marginRight: 'var(--pf-t--global--spacer--sm)' }}>
                {getRuleStatus(CONFORMA_RESULT_STATUS.successes)}
              </span>
              <b>{resultSummary[CONFORMA_RESULT_STATUS.successes]}</b>
            </FlexItem>
          </Flex>
        </Flex>
      </Flex>
      {crLoaded && filteredCRResult.length > 0 ? (
        <ConformaTable conformaResult={filteredCRResult} />
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
    </>
  );
};
