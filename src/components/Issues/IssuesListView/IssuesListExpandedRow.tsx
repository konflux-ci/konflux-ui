import * as React from 'react';
import { Flex, FlexItem, capitalize, Modal, ModalVariant, Button } from '@patternfly/react-core';
import { Issue, IssueState } from '~/kite/issue-type';
import { TableData, Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { RowFunctionArgs } from '~/shared/components/table/VirtualBody';
import { IssueStatus } from '../IssueStatus';
import { issuesExpandedTableColumnClasses } from './IssuesListExpandedHeader';
import { severityIcon } from './utils/issue-utils';

export const IssuesListExpandedRow: React.FC<RowFunctionArgs<Issue>> = ({ obj: issue }) => {
  const hasContent = issue.links?.length || issue.description;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const handleModalToggle = () => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };

  if (!hasContent) return null;

  const links =
    issue.links?.map((link, index) => (
      <FlexItem key={`${link.id}-${index}`}>
        <ExternalLink href={link.url}>{link.title}</ExternalLink>
      </FlexItem>
    )) ?? [];

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
        {severityIcon(issue.severity)} {capitalize(issue.severity)}
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.status}>
        <IssueStatus locked={issue.state === IssueState.RESOLVED} />
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.reason}>
        {issue.description ?? '-'}
      </TableData>

      <TableData className={issuesExpandedTableColumnClasses.usefulLinks}>
        <Flex direction={{ default: 'column' }}>
          {issue.links?.length ? (
            issue.links?.length > 2 ? (
              <>
                <Button variant="link" isInline onClick={handleModalToggle}>
                  View all
                </Button>
                <Modal
                  bodyAriaLabel="Scrollable modal content"
                  tabIndex={0}
                  variant={ModalVariant.small}
                  title="All links"
                  isOpen={isModalOpen}
                  onClose={handleModalToggle}
                >
                  {links}
                </Modal>
              </>
            ) : (
              links
            )
          ) : (
            '-'
          )}
        </Flex>
      </TableData>
    </>
  );
};
