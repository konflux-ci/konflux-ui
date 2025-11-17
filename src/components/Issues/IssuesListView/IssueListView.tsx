import * as React from 'react';
import { EmptyStateBody, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import emptyStateImgUrl from '~/assets/success.svg';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useSortedResources } from '~/hooks/useSortedResources';
import { Issue, IssueSeverity, IssueState } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { Table, useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { IssuesTableHeader, SortableIssuesHeaders } from './IssuesListHeader';
import IssuesListRow from './IssuesListRow';

import './IssueListView.scss';

const sortPaths: Record<SortableIssuesHeaders, string> = {
  [SortableIssuesHeaders.title]: 'title',
  [SortableIssuesHeaders.scope]: 'scope.resourceType',
  [SortableIssuesHeaders.severity]: 'severity',
  [SortableIssuesHeaders.status]: 'status',
  [SortableIssuesHeaders.createdAt]: 'createdAt',
  [SortableIssuesHeaders.description]: 'description',
};

const NoDataEmptyMessage = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No issues found">
    <EmptyStateBody>
      No issues have been detected for this application. Issues can include security
      vulnerabilities, build failures, performance problems, and other concerns that need attention.
    </EmptyStateBody>
  </AppEmptyState>
);

const IssueListView = () => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: { name: string; status: string[]; severity: string[] } = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    severity: unparsedFilters.severity ? (unparsedFilters.severity as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter, severity: severityFilter } = filters;

  const { data: issuesData, isLoading, error } = useIssues({ namespace });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const issues = issuesData?.data || [];

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableIssuesHeaders.title);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  const IssuesListHeaderWithSorting = React.useMemo(
    () =>
      IssuesTableHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortIndex, activeSortDirection],
  );

  const filteredIssues = React.useMemo(
    () =>
      issues.filter((issue) => {
        const matchesName =
          !nameFilter || issue.title.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesStatus = !statusFilter?.length || statusFilter.includes(issue.state);
        const matchesSeverity = !severityFilter?.length || severityFilter.includes(issue.severity);

        return matchesName && matchesStatus && matchesSeverity;
      }),
    [issues, statusFilter, severityFilter, nameFilter],
  );

  const defaultSortedIssues = useSortedResources(
    filteredIssues,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(issues, (issue) => issue.state, [IssueState.ACTIVE, IssueState.RESOLVED]),
    [issues],
  );

  const severityFilterObj = React.useMemo(
    () =>
      createFilterObj(issues, (issue) => issue.severity, [
        IssueSeverity.INFO,
        IssueSeverity.MINOR,
        IssueSeverity.MAJOR,
        IssueSeverity.CRITICAL,
      ]),
    [issues],
  );

  const EmptyMessage = () => (
    <FilteredEmptyState
      onClearFilters={onClearFilters}
      data-test="issues-list-view__all-filtered"
    />
  );

  const toolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="issue name"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      dataTest="issues-list-toolbar"
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(status) => setFilters({ ...filters, status })}
        options={statusFilterObj}
      />
      <MultiSelect
        label="Severity"
        filterKey="severity"
        values={severityFilter}
        setValues={(severity) => setFilters({ ...filters, severity })}
        options={severityFilterObj}
      />
    </BaseTextFilterToolbar>
  );

  if (error) {
    return getErrorState(error, !isLoading, 'issues');
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Issues list <FeatureFlagIndicator flags={['issues-dashboard']} />
      </Title>
      <TextContent>
        <Text component={TextVariants.p}>This list shows current Konflux issues.</Text>
      </TextContent>
      <div data-test="issues-list">
        <Table
          virtualize
          data={defaultSortedIssues}
          unfilteredData={issues}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={toolbar}
          aria-label="Issues List"
          Header={IssuesListHeaderWithSorting}
          Row={IssuesListRow}
          loaded={!isLoading}
          getRowProps={(obj: Issue) => ({
            id: `${obj.id}-issue-list-item`,
            'aria-label': obj.title,
          })}
        />
      </div>
    </>
  );
};

export default IssueListView;
