/* eslint-disable */
import * as React from 'react';
import { EmptyStateBody, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { Issue, IssueSeverity, IssueState, IssueType, RelatedIssue } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { Table, useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import emptyStateImgUrl from '../../../shared/assets/Not-found.svg';
import IssuesListHeader from './IssuesListHeader';
import IssuesListExpandedHeader from './IssuesListExpandedHeader';
import IssuesListRow from './IssuesListRow';
import { IssuesListExpandedRow } from './IssuesListExpandedRow';
import { RowFunctionArgs } from '~/shared/components/table/VirtualBody';

import './IssueListView.scss';

// const mockIssuesTestBase: Omit<Issue, 'relatedFrom' | 'relatedTo'>[] = [
//   {
//     id: 'TEST1',
//     title: 'Build Failure in Component A',
//     description:
//       'The build pipeline failed due to missing dependencies in the component configuration.',
//     severity: IssueSeverity.CRITICAL,
//     issueType: IssueType.BUILD,
//     state: IssueState.ACTIVE,
//     detectedAt: '2025-10-20T10:30:00Z',
//     namespace: 'default',
//     scope: {
//       resourceType: 'component',
//       resourceName: 'component-a',
//       resourceNamespace: 'default',
//     },
//     links: [
//       {
//         id: 'link-test1-1',
//         title: 'Build Logs',
//         url: 'https://example.com/builds/12345',
//         issueId: 'TEST1',
//       },
//       {
//         id: 'link-test1-2',
//         title: 'Documentation',
//         url: 'https://docs.example.com/build-troubleshooting',
//         issueId: 'TEST1',
//       },
//     ],
//     createdAt: '2025-10-20T10:30:00Z',
//     updatedAt: '2025-10-20T15:45:00Z',
//   },
//   {
//     id: 'TEST2',
//     title: 'Dependency Vulnerability Detected',
//     description: 'A high severity vulnerability was found in the lodash package version 4.17.15.',
//     severity: IssueSeverity.MAJOR,
//     issueType: IssueType.DEPENDENCY,
//     state: IssueState.ACTIVE,
//     detectedAt: '2025-10-21T08:15:00Z',
//     namespace: 'production',
//     scope: {
//       resourceType: 'application',
//       resourceName: 'frontend-app',
//       resourceNamespace: 'production',
//     },
//     links: [
//       {
//         id: 'link-test2-1',
//         title: 'CVE Report',
//         url: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-23337',
//         issueId: 'TEST2',
//       },
//       {
//         id: 'link-test2-2',
//         title: 'Security Advisory',
//         url: 'https://github.com/lodash/lodash/security/advisories',
//         issueId: 'TEST2',
//       },
//       {
//         id: 'link-test2-3',
//         title: 'Patch Information',
//         url: 'https://security.snyk.io/vuln/SNYK-JS-LODASH-590103',
//         issueId: 'TEST2',
//       },
//     ],
//     createdAt: '2025-10-21T08:15:00Z',
//     updatedAt: '2025-10-21T09:30:00Z',
//   },
//   {
//     id: 'TEST3',
//     title: 'Integration Test Passed with Warnings',
//     description: 'Integration tests completed successfully but with minor performance warnings.',
//     severity: IssueSeverity.MINOR,
//     issueType: IssueType.TEST,
//     state: IssueState.RESOLVED,
//     detectedAt: '2025-10-19T14:00:00Z',
//     namespace: 'staging',
//     scope: {
//       resourceType: 'pipeline',
//       resourceName: 'integration-test-pipeline',
//       resourceNamespace: 'staging',
//     },
//     links: [
//       {
//         id: 'link-test3-1',
//         title: 'Test Results',
//         url: 'https://example.com/tests/results/789',
//         issueId: 'TEST3',
//       },
//     ],
//     createdAt: '2025-10-19T14:00:00Z',
//     updatedAt: '2025-10-22T11:20:00Z',
//   },
// ];

// // Now create the full issues with relationships
// const mockIssuesTest: Issue[] = [
//   {
//     ...mockIssuesTestBase[0],
//     // TEST1 is related TO TEST2 (build failure caused by dependency issue)
//     relatedTo: [
//       {
//         id: 'rel-test1-to-test2',
//         sourceID: 'TEST1',
//         targetID: 'TEST2',
//         source: { ...mockIssuesTestBase[0], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[1], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//     // TEST1 is related FROM TEST3 (test warnings revealed build issues)
//     relatedFrom: [
//       {
//         id: 'rel-test3-to-test1',
//         sourceID: 'TEST3',
//         targetID: 'TEST1',
//         source: { ...mockIssuesTestBase[2], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[0], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//   },
//   {
//     ...mockIssuesTestBase[1],
//     // TEST2 is related TO TEST3 (dependency issue affected test results)
//     relatedTo: [
//       {
//         id: 'rel-test2-to-test3',
//         sourceID: 'TEST2',
//         targetID: 'TEST3',
//         source: { ...mockIssuesTestBase[1], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[2], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//     // TEST2 is related FROM TEST1 (build failure caused by dependency issue)
//     relatedFrom: [
//       {
//         id: 'rel-test1-to-test2',
//         sourceID: 'TEST1',
//         targetID: 'TEST2',
//         source: { ...mockIssuesTestBase[0], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[1], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//   },
//   {
//     ...mockIssuesTestBase[2],
//     // TEST3 is related TO TEST1 (test warnings revealed build issues)
//     relatedTo: [
//       {
//         id: 'rel-test3-to-test1',
//         sourceID: 'TEST3',
//         targetID: 'TEST1',
//         source: { ...mockIssuesTestBase[2], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[0], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//     // TEST3 is related FROM TEST2 (dependency issue affected test results)
//     relatedFrom: [
//       {
//         id: 'rel-test2-to-test3',
//         sourceID: 'TEST2',
//         targetID: 'TEST3',
//         source: { ...mockIssuesTestBase[1], relatedFrom: [], relatedTo: [] } as Issue,
//         target: { ...mockIssuesTestBase[2], relatedFrom: [], relatedTo: [] } as Issue,
//       },
//     ],
//   },
// ];

// const mockIssues = {
//   data: mockIssuesTest
// }

const IssueListView = () => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: { name: string; status: string[]; severity: string[] } = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    severity: unparsedFilters.severity ? (unparsedFilters.severity as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter, severity: severityFilter } = filters;

  // State to track expanded rows
  const [expandedIssues, setExpandedIssues] = React.useState<Set<number>>(new Set());

  const { data: issuesData, isLoading, error } = useIssues({ namespace });
  const issues = React.useMemo(() => {
    if (isLoading || error) return [];
    return issuesData.data.map((issue) => {
      const relatedIssues = issue.relatedFrom
        .concat(issue.relatedTo)
        .map((related) => [related.source, related.target])
        .flat()
        .reduce((acc, cur) => {
          if (!acc.some((item) => item.id === cur.id)) {
            acc.push(cur);
          }
          return acc;
        }, []);
      const groups: Record<string, number> = relatedIssues.reduce((acc, cur) => {
        if (!acc[cur.scope.resourceType]) {
          acc[cur.scope.resourceType] = 1;
        }
        acc[cur.scope.resourceType]++;
        return acc;
      }, {});
      return {
        ...issue,
        scope: {
          resourceType:
            Object.keys(groups).length > 1
              ? `${Object.keys(groups).length} groups`
              : `${Object.values(groups)[0]} ${Object.keys(groups)[0]}${Object.values(groups)[0] > 1 ? 's' : ''}`,
          data: relatedIssues,
        },
      };
    });
  }, [issuesData, isLoading]);

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
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No issues found">
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

  if (error) {
    return getErrorState(error, isLoading, 'issues');
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
          loaded={!isLoading}
          getRowProps={(obj: Issue) => ({
            id: `${obj.id}-issue-list-item`,
            'aria-label': obj.title,
          })}
          expand
          ExpandedContent={(
            props: RowFunctionArgs<
              Issue & { scope: { resourceType: string; data: RelatedIssue[] } }
            >,
          ) => {
            const issue = props.obj;
            return (
              <div className="issues-list-view__expanded-row">
                <Table
                  data={issue.scope.data}
                  Row={IssuesListExpandedRow}
                  Header={IssuesListExpandedHeader}
                  loaded={!isLoading}
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
