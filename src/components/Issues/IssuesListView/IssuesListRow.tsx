import * as React from 'react';
import { Button, Flex, FlexItem, ModalVariant, Truncate, capitalize } from '@patternfly/react-core';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { Issue, IssueState } from '~/kite/issue-type';
import { RowFunctionArgs, TableData, Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { IssueStatus } from '../IssueStatus';
import { issuesTableColumnClasses } from './IssuesListHeader';
import { severityIcon } from './utils/issue-utils';

const IssuesListRow: React.FC<RowFunctionArgs<Issue>> = ({ obj: issue }) => {
  const showModal = useModalLauncher();

  const LinksModal = () => (
    <Flex direction={{ default: 'column' }}>
      {issue.links?.map((link, index) => (
        <FlexItem key={`${link.id}-${index}`}>
          <ExternalLink href={link.url}>{link.title}</ExternalLink>
        </FlexItem>
      ))}
    </Flex>
  );

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
        {capitalize(issue.scope.resourceType)}
      </TableData>

      <TableData className={issuesTableColumnClasses.severity}>
        {severityIcon(issue.severity)} {capitalize(issue.severity)}
      </TableData>

      <TableData className={issuesTableColumnClasses.status}>
        <IssueStatus locked={issue.state === IssueState.RESOLVED} />
      </TableData>

      <TableData className={issuesTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesTableColumnClasses.description}>
        <Truncate content={issue.description ?? '-'} />
      </TableData>

      <TableData className={issuesTableColumnClasses.usefulLinks}>
        {issue.links?.length ? (
          issue.links?.length > 2 ? (
            <>
              <Button
                variant="link"
                isInline
                onClick={() =>
                  showModal(
                    createModalLauncher(LinksModal, {
                      'data-test': 'modal-links',
                      bodyAriaLabel: 'Scrollable modal content',
                      variant: ModalVariant.small,
                      title: 'All links',
                    })(),
                  )
                }
              >
                View all
              </Button>
            </>
          ) : (
            <LinksModal />
          )
        ) : (
          '-'
        )}
      </TableData>
    </>
  );
};

export default IssuesListRow;
