/* eslint-disable */
import * as React from 'react';
import {
  Alert,
  AlertVariant,
  EmptyStateBody,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import { capitalize } from 'lodash-es';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { getErrorState } from '~/shared/utils/error-utils';
import { Table, useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { IssueRow } from './IssuesListRow';
import IssuesListHeader from './IssuesListHeader';
import IssuesListRow from './IssuesListRow';

import './IssueListView.scss';

type IssueListViewProps = {
  applicationName: string;
};

// Mock data for demonstration - replace with actual data fetching
const mockIssues: IssueRow[] = [
  {
    issueTitle: 'Security vulnerability in dependency',
    componentName: 'frontend',
    severity: 'High',
    status: 'Open',
    createdAt: '2024-01-15T10:30:00Z',
    reason: 'Outdated package version',
    links: [
      {
        label: 'CVE Details',
        href: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1234',
      },
      { label: 'Fix PR', href: 'https://github.com/example/repo/pull/123' },
    ],
    actions: [
      { label: 'View Details', callback: () => console.log('View details') },
      { label: 'Mark as Resolved', callback: () => console.log('Mark resolved') },
    ],
  },
  {
    issueTitle: 'Build failure in CI/CD pipeline',
    componentName: 'backend',
    severity: 'Medium',
    status: 'In Progress',
    createdAt: '2024-01-14T14:20:00Z',
    reason: 'Test timeout',
    links: [{ label: 'Build Logs', href: 'https://jenkins.example.com/build/456' }],
    actions: [{ label: 'View Logs', callback: () => console.log('View logs') }],
  },
  {
    issueTitle: 'Performance regression',
    componentName: 'api',
    severity: 'Low',
    status: 'Closed',
    createdAt: '2024-01-13T09:15:00Z',
    reason: 'N+1 query issue',
    links: [],
    actions: [{ label: 'Reopen', callback: () => console.log('Reopen') }],
  },
];

const IssueListView: React.FC<React.PropsWithChildren<IssueListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    severity: unparsedFilters.severity ? (unparsedFilters.severity as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter, severity: severityFilter } = filters;

  // Mock loading states - replace with actual data fetching
  const [issues, issuesLoaded, issuesError] = React.useState<[IssueRow[], boolean, any]>([
    mockIssues,
    true,
    null,
  ]);

  const filteredIssues = React.useMemo(
    () =>
      issues[0].filter((issue) => {
        const matchesName =
          !nameFilter || issue.issueTitle.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesStatus =
          !statusFilter?.length || statusFilter.includes(capitalize(issue.status));
        const matchesSeverity =
          !severityFilter?.length || severityFilter.includes(capitalize(issue.severity));

        return matchesName && matchesStatus && matchesSeverity;
      }),
    [issues, statusFilter, severityFilter, nameFilter],
  );

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(issues[0], (issue) => issue.status, [
        'Open',
        'In Progress',
        'Closed',
        'Resolved',
      ]),
    [issues],
  );

  const severityFilterObj = React.useMemo(
    () =>
      createFilterObj(issues[0], (issue) => issue.severity, ['High', 'Medium', 'Low', 'Critical']),
    [issues],
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState emptyStateImg={undefined} title="No issues found">
      <EmptyStateBody>
        No issues have been detected for this application. Issues can include security
        vulnerabilities, build failures, performance problems, and other concerns that need
        attention.
      </EmptyStateBody>
    </AppEmptyState>
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
      label="name"
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

  if (issuesError) {
    return getErrorState(issuesError, issuesLoaded, 'issues');
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Issues
      </Title>
      <TextContent>
        <Text component={TextVariants.p}>
          Issues represent problems, vulnerabilities, or concerns that need attention in your
          application. These can include security vulnerabilities, build failures, performance
          issues, and more.
        </Text>
      </TextContent>
      <div data-test="issues-list">
        <Table
          virtualize={false}
          data={filteredIssues}
          unfilteredData={issues[0]}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={toolbar}
          aria-label="Issues List"
          Header={IssuesListHeader}
          Row={IssuesListRow}
          loaded={issuesLoaded}
          getRowProps={(obj: IssueRow) => ({
            id: `${obj.issueTitle.replace(/\s+/g, '-').toLowerCase()}-issue-list-item`,
            'aria-label': obj.issueTitle,
          })}
        />
      </div>
    </>
  );
};

export default IssueListView;
