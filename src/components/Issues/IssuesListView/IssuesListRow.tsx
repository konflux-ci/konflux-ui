import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import {
  CriticalIcon,
  HighIcon,
  LowIcon,
  MediumIcon,
  UnknownIcon,
} from '~/components/PipelineRun/ScanDetailStatus';
import { RowFunctionArgs, TableData, Timestamp } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { IssueStatus } from '../IssueStatus';
import { issuesTableColumnClasses } from './IssuesListHeader';

export type IssueListRowCustomData = {
  onToggle?: (issueId: string) => void;
};

export type IssueRow = {
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
  issueType?: string;
  state?: string;
  detectedAt?: string;
  namespace?: string;
  scope?: {
    resourceType: string;
    resourceName: string;
    resourceNamespace: string;
  };
  links?: string[];
  createdAt?: string;
  updatedAt?: string;
  relatedTo?: {
    id: string;
    sourceId: string;
    targetId: string;
    source: string;
    target: string;
  }[];
  relatedFrom?: {
    id: string;
    sourceId: string;
    targetId: string;
    source: string;
    target: string;
  }[];
};

const IssuesListRow: React.FC<RowFunctionArgs<IssueRow, IssueListRowCustomData>> = ({
  obj: issue,
  customData,
}) => {
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

  const handleComponentClick = () => {
    if (customData?.onToggle) {
      customData.onToggle(issue.id);
    }
  };

  return (
    <>
      <TableData className={issuesTableColumnClasses.issue} data-test="issues-list-item">
        <Flex direction={{ default: 'column' }}>
          <FlexItem data-test="issues-list-item-title" style={{ minWidth: '30%' }}>
            {issue.title}
          </FlexItem>
        </Flex>
      </TableData>

      <TableData className={issuesTableColumnClasses.scope}>
        <Button
          variant="link"
          isInline
          onClick={handleComponentClick}
          data-test="issues-component-name-button"
        >
          {issue.scope.resourceType}
        </Button>
      </TableData>

      <TableData className={issuesTableColumnClasses.severity}>
        {severityIcon(issue.severity)} {issue.severity}
      </TableData>

      <TableData className={issuesTableColumnClasses.status}>
        <IssueStatus locked={issue.state === 'RESOLVED'} />
      </TableData>

      <TableData className={issuesTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesTableColumnClasses.reason}>{issue.description ?? '-'}</TableData>

      <TableData className={issuesTableColumnClasses.usefulLinks}>
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

      <TableData className={issuesTableColumnClasses.kebab}>
        <div className="issues-list-view__row-actions">
          <ActionMenu actions={[]} />
        </div>
      </TableData>
    </>
  );
};

export default IssuesListRow;
