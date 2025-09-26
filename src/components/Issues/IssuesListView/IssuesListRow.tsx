import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { RowFunctionArgs, TableData } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { issuesTableColumnClasses } from './IssuesListHeader';

export type IssueRow = {
  issueTitle: string;
  componentName: string;
  severity: string;
  status: string;
  createdAt: string; // ISO string or formatted date
  reason?: string;
  links?: { label: string; href: string }[];
  actions?: { label: string; callback: () => void }[];
};

const IssuesListRow: React.FC<RowFunctionArgs<IssueRow>> = ({ obj: issue }) => {
  return (
    <>
      <TableData className={issuesTableColumnClasses.issue} data-test="issues-list-item">
        <Flex direction={{ default: 'column' }}>
          <FlexItem data-test="issues-list-item-title" style={{ minWidth: '30%' }}>
            <b>{issue.issueTitle}</b>
          </FlexItem>
        </Flex>
      </TableData>

      <TableData className={issuesTableColumnClasses.component}>{issue.componentName}</TableData>

      <TableData className={issuesTableColumnClasses.severity}>{issue.severity}</TableData>

      <TableData className={issuesTableColumnClasses.status}>{issue.status}</TableData>

      <TableData className={issuesTableColumnClasses.createdAt}>{issue.createdAt}</TableData>

      <TableData className={issuesTableColumnClasses.reason}>{issue.reason ?? '-'}</TableData>

      <TableData className={issuesTableColumnClasses.usefulLinks}>
        <Flex direction={{ default: 'column' }}>
          {issue.links?.length
            ? issue.links.map((l) => (
                <FlexItem key={`${l.href}-${l.label}`}>
                  <ExternalLink href={l.href} text={l.label} />
                </FlexItem>
              ))
            : '-'}
        </Flex>
      </TableData>

      <TableData className={issuesTableColumnClasses.kebab}>
        <div className="issues-list-view__row-actions">
          {issue.actions?.map((a) => (
            <Button
              key={a.label}
              onClick={a.callback}
              variant="link"
              data-test={`issues-row-action-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
              isInline
            >
              {a.label}
            </Button>
          ))}
          <ActionMenu actions={[]} />
        </div>
      </TableData>
    </>
  );
};

export default IssuesListRow;
