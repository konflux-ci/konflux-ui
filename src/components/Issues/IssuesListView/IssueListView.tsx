/* eslint-disable */
import * as React from 'react';
import { EmptyStateBody, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
// import { capitalize } from 'lodash-es';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { getErrorState } from '~/shared/utils/error-utils';
import { Table, useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { IssueRow } from './IssuesListRow';
import IssuesListHeader from './IssuesListHeader';
import IssuesListExpandedHeader from './IssuesListExpandedHeader';
import IssuesListRow from './IssuesListRow';
import { IssuesListExpandedRow } from './IssuesListExpandedRow';
import { ExpandableRowContent } from '@patternfly/react-table';

import './IssueListView.scss';

type IssueListViewProps = {
  applicationName: string;
};

// Mock data for demonstration - replace with actual data fetching
const mockIssuesRaw: IssueRow[] = [
  {
    id: 'RT1',
    title: 'Title Issue #1',
    description: 'Desc #1',
    severity: 'critical',
    issueType: 'build',
    state: 'ACTIVE',
    detectedAt: '2025-10-13',
    namespace: 'default',
    scope: {
      resourceType: 'componment',
      resourceName: 'name',
      resourceNamespace: 'default',
    },
    links: ['https://link1.com', 'https://link2.com'],
    createdAt: '2025-10-13',
    updatedAt: '2025-10-13',
  },
  {
    id: '000000',
    title: 'Title Issue #2',
    description: 'Desc #2',
    severity: 'critical',
    issueType: 'build',
    state: 'ACTIVE',
    detectedAt: '2025-10-13',
    namespace: 'default',
    scope: {
      resourceType: 'componment',
      resourceName: 'name',
      resourceNamespace: 'default',
    },
    links: ['https://link1.com', 'https://link2.com'],
    createdAt: '2025-10-13',
    updatedAt: '2025-10-13',
    relatedTo: [
      {
        id: '00000r1',
        sourceId: 'RT1',
        targetId: undefined,
        source: undefined,
        target: undefined,
      },
    ],
    relatedFrom: [
      {
        id: '00000r1',
        sourceId: 'RF1',
        targetId: undefined,
        source: undefined,
        target: undefined,
      },
    ],
  },
];

// const mockIssues: IssueRow[] = [
const mockIssues = [
  {
    id: 'RT1',
    title: 'Title Issue #1',
    description: 'Desc #1',
    severity: 'minor',
    createdAt: '2025-10-12',
    // issueType: "build",
    state: 'RESOLVED',
    // detectedAt: "2025-10-13",
    // namespace: "default",
    scope: {
      resourceType: 'compo',
      data: [
        {
          name: 'a',
          severity: 'critical',
          status: 'x',
          createdAt: '2025-10-13',
          description: 'Desc #11',
          links: ['https://link1.com'],
        },
        {
          name: 'b',
          severity: 'critical',
          status: 'y',
          createdAt: '2025-10-13',
          description: 'Desc #12',
          links: ['https://link2.com'],
        },
      ],
      links: ['https://link1.com', 'https://link2.com'],
    },
  },
  {
    id: 'RT2',
    title: 'Title Issue #2',
    description: 'Desc #2',
    severity: 'critical',
    createdAt: '2025-10-12',
    // issueType: "build",
    state: 'ACTIVE',
    scope: {
      resourceType: 'compo',
      data: [
        {
          name: 'a',
          severity: 'critical',
          status: 'x',
          createdAt: '2025-10-13',
          description: 'Desc #21',
          links: ['https://link1.com'],
        },
        {
          name: 'b',
          severity: 'critical',
          status: 'y',
          createdAt: '2025-10-13',
          description: 'Desc #22',
          links: ['https://link2.com'],
        },
      ],
      links: ['https://link1.com', 'https://link2.com'],
    },
  },
  {
    id: 'RT3',
    title: 'Title Issue #3',
    description: 'Desc #3',
    severity: 'info',
    createdAt: '2025-10-12',
    // issueType: "build",
    state: 'ACTIVE',
    // detectedAt: "2025-10-13",
    // namespace: "default",
    scope: {
      resourceType: 'namespace',
      data: [
        {
          name: 'a',
          severity: 'critical',
          status: 'x',
          createdAt: '2025-10-13',
          description: 'Desc #31',
          links: ['https://link1.com'],
        },
        {
          name: 'b',
          severity: 'critical',
          status: 'y',
          createdAt: '2025-10-13',
          description: 'Desc #32',
          links: ['https://link2.com'],
        },
      ],
      links: ['https://link1.com', 'https://link2.com'],
    },
  },
];

const IssueListView: React.FC<React.PropsWithChildren<IssueListViewProps>> = () => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: { name: string; status: string[]; severity: string[] } = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    severity: unparsedFilters.severity ? (unparsedFilters.severity as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter, severity: severityFilter } = filters;

  // State to track expanded rows
  const [expandedIssues, setExpandedIssues] = React.useState<Set<number>>(new Set());

  // Mock loading states - replace with actual data fetching
  const [issues] = React.useState<typeof mockIssues>(mockIssues);
  const issuesLoaded = true;
  const issuesError = null;

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

  const statusFilterObj = React.useMemo(
    () => createFilterObj(issues, (issue) => issue.state, ['ACTIVE', 'RESOLVED']),
    [issues],
  );

  const severityFilterObj = React.useMemo(
    () =>
      createFilterObj(issues, (issue) => issue.severity, ['info', 'minor', 'major', 'critical']),
    [issues],
  );

  const handleToggle = (issueId: string) => {
    const refRow = filteredIssues.findIndex((issue) => issue.id == issueId);
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(refRow)) {
        next.delete(refRow);
      } else {
        next.add(refRow);
      }
      return next;
    });
  };

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
          Summary of issues in your Konflux content at any point in time.
        </Text>
      </TextContent>
      <div data-test="issues-list">
        <Table
          virtualize
          data={filteredIssues}
          unfilteredData={issues}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={toolbar}
          aria-label="Issues List"
          Header={IssuesListHeader}
          Row={IssuesListRow}
          loaded={issuesLoaded}
          getRowProps={(obj: (typeof mockIssues)[0]) => ({
            id: `${obj.id}-issue-list-item`,
            'aria-label': obj.title,
          })}
          expand
          ExpandedContent={(props) => {
            const issue = props.obj;
            return (
              <div className="issues-list-view__expanded-row">
                <Table
                  data={issue.scope.data}
                  Row={IssuesListExpandedRow}
                  Header={IssuesListExpandedHeader}
                  loaded={true}
                  EmptyMsg={EmptyMessage}
                  aria-label="Expanded Issues List"
                  virtualize
                />
              </div>
            );
          }}
          customData={{
            onToggle: handleToggle,
            customExpand: expandedIssues,
            disableRegularExpand: true,
          }}
        />
      </div>
    </>
  );
};

export default IssueListView;
