import * as React from 'react';
import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Spinner,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { useDeepCompareMemoize } from '~/shared';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { FilterContext } from '../Filter/generic/FilterContext';
import { MultiSelect } from '../Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '../Filter/utils/filter-utils';
import { EnterpriseContractTable } from './EnterpriseContractTable/EnterpriseContractTable';
import SecurityTabEmptyState from './SecurityTabEmptyState';
import { ENTERPRISE_CONTRACT_STATUS } from './types';
import { useEnterpriseContractResults } from './useEnterpriseContractResultFromLogs';
import { getRuleStatus } from './utils';

const statuses = [
  ENTERPRISE_CONTRACT_STATUS.violations,
  ENTERPRISE_CONTRACT_STATUS.warnings,
  ENTERPRISE_CONTRACT_STATUS.successes,
];

const getResultsSummary = (ECs, ecLoaded) => {
  const statusFilter = Object.fromEntries(statuses.map((status) => [status, 0]));
  return ecLoaded && ECs
    ? ECs?.reduce((acc, ec) => {
        if (acc[ec.status]) {
          acc[ec.status] += 1;
        } else {
          acc[ec.status] = 1;
        }
        return acc;
      }, statusFilter)
    : statusFilter;
};

export const SecurityEnterpriseContractTab: React.FC<
  React.PropsWithChildren<{ pipelineRun: string }>
> = ({ pipelineRun }) => {
  const [ecResult, ecResultLoaded] = useEnterpriseContractResults(pipelineRun);

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    rule: unparsedFilters.rule ? (unparsedFilters.rule as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    component: unparsedFilters.component ? (unparsedFilters.component as string[]) : [],
  });

  const { rule: ruleFilter, status: statusFilter, component: componentFilter } = filters;

  const statusFilterObj = React.useMemo(
    () =>
      ecResultLoaded && ecResult ? createFilterObj(ecResult, (ec) => ec.status, statuses) : {},
    [ecResult, ecResultLoaded],
  );

  const componentFilterObj = React.useMemo(
    () => (ecResultLoaded && ecResult ? createFilterObj(ecResult, (ec) => ec.component) : {}),
    [ecResult, ecResultLoaded],
  );

  // filter data in table
  const filteredECResult = React.useMemo(() => {
    return ecResultLoaded && ecResult
      ? ecResult?.filter((rule) => {
          return (
            (!ruleFilter || rule.title.toLowerCase().indexOf(ruleFilter.toLowerCase()) !== -1) &&
            (!statusFilter.length || statusFilter.includes(rule.status)) &&
            (!componentFilter.length || componentFilter.includes(rule.component))
          );
        })
      : undefined;
  }, [componentFilter, ecResult, ecResultLoaded, ruleFilter, statusFilter]);

  // result summary
  const resultSummary = React.useMemo(
    () => getResultsSummary(filteredECResult, ecResultLoaded),
    [filteredECResult, ecResultLoaded],
  );

  const toolbar = (
    <BaseTextFilterToolbar
      text={ruleFilter}
      label="rule"
      setText={(rule) => setFilters({ ...filters, rule })}
      onClearFilters={onClearFilters}
      dataTest="security-enterprise-contract-list-toolbar"
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

  if (!ecResultLoaded && !filteredECResult) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else if (ecResultLoaded && !filteredECResult) {
    return <SecurityTabEmptyState />;
  }

  return (
    <>
      <TextContent style={{ marginTop: 'var(--pf-v5-global--spacer--lg)' }}>
        <Text component={TextVariants.h3}>Testing apps against Enterprise Contract</Text>
        <Text component={TextVariants.p}>
          Enterprise Contract is a set of tools for verifying the provenance of application
          snapshots and validating them against a clearly defined policy.
          <br />
          The Enterprise Contract policy is defined using the{' '}
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
                href="https://enterprisecontract.dev/docs/ec-policies/index.html"
                target="_blank"
                rel="noreferrer"
              />
            )}
          >
            Enterprise Contract Policies
          </Button>
          .
        </Text>
      </TextContent>
      <Flex style={{ marginTop: 'var(--pf-v5-global--spacer--xl)' }}>
        <FlexItem style={{ marginRight: 'var(--pf-v5-global--spacer--2xl)' }}>
          <TextContent>
            <Text component={TextVariants.h3}>Results</Text>
          </TextContent>
          {toolbar}
        </FlexItem>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <TextContent>
              <Text component={TextVariants.h3}>Results summary</Text>
            </TextContent>
          </FlexItem>
          <Flex data-test="result-summary" spaceItems={{ default: 'spaceItemsXl' }}>
            <FlexItem spacer={{ default: 'spacerXl' }}>
              <span style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}>
                {getRuleStatus(ENTERPRISE_CONTRACT_STATUS.violations)}
              </span>
              <b>{resultSummary[ENTERPRISE_CONTRACT_STATUS.violations]}</b>
            </FlexItem>
            <FlexItem>
              <span style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}>
                {getRuleStatus(ENTERPRISE_CONTRACT_STATUS.warnings)}
              </span>
              <b>{resultSummary[ENTERPRISE_CONTRACT_STATUS.warnings]}</b>
            </FlexItem>
            <FlexItem>
              <span style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}>
                {getRuleStatus(ENTERPRISE_CONTRACT_STATUS.successes)}
              </span>
              <b>{resultSummary[ENTERPRISE_CONTRACT_STATUS.successes]}</b>
            </FlexItem>
          </Flex>
        </Flex>
      </Flex>
      {ecResultLoaded && filteredECResult.length > 0 ? (
        <EnterpriseContractTable ecResult={filteredECResult} />
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
    </>
  );
};
