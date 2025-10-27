import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import {
  CriticalIcon,
  HighIcon,
  LowIcon,
  MediumIcon,
  UnknownIcon,
} from '~/components/PipelineRun/ScanDetailStatus';
import { Issue } from '~/kite/issue-type';
import { TableData, Timestamp } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { RowFunctionArgs } from '~/shared/components/table/VirtualBody';
import { IssueStatus } from '../IssueStatus';
import { issuesExpandedTableColumnClasses } from './IssuesListExpandedHeader';

export const IssuesListExpandedRow: React.FC<RowFunctionArgs<Issue>> = ({ obj: issue }) => {
  const hasContent = issue.links?.length || issue.description;
  const severityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <CriticalIcon />;
      case 'major':
        return <HighIcon />;
      case 'minor':
        return <MediumIcon />;
      case 'info':
        return <LowIcon />;
      default:
        return <UnknownIcon />;
    }
  };

  if (!hasContent) return null;

  return (
    <>
      <TableData className={issuesExpandedTableColumnClasses.issue} data-test="issues-list-item">
        <Flex direction={{ default: 'column' }}>
          <FlexItem data-test="issues-list-item-title" style={{ minWidth: '30%' }}>
            {issue.title}
          </FlexItem>
        </Flex>
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.severity}>
        {severityIcon(issue.severity)} {issue.severity}
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.status}>
        <IssueStatus locked={issue.state === 'RESOLVED'} />
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.reason}>
        {issue.description ?? '-'}
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.usefulLinks}>
        <Flex direction={{ default: 'column' }}>
          {issue.links?.length
            ? issue.links.map((link, index) => (
                <FlexItem key={`${link.id}-${index}`}>
                  <ExternalLink href={link.url} />
                </FlexItem>
              ))
            : '-'}
        </Flex>
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.kebab}>
        <div className="issues-list-view__row-actions">
          <ActionMenu actions={[]} />
        </div>
      </TableData>
    </>
  );
};
