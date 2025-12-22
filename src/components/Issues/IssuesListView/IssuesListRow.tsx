import * as React from 'react';
import { Button, Flex, FlexItem, ModalVariant, capitalize } from '@patternfly/react-core';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { Issue, IssueState } from '~/kite/issue-type';
import { RowFunctionArgs, TableData, Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import { IssueStatus } from '../IssueStatus';
import { issuesTableColumnClasses } from './IssuesListHeader';
import { severityIcon } from './utils/issue-utils';

const IssuesListRow: React.FC<RowFunctionArgs<Issue>> = ({ obj: issue }) => {
  const showModal = useModalLauncher();

  const LinksModal = () => (
    <Flex direction={{ default: 'column' }}>
      {issue.links?.map((link) => (
        <FlexItem key={link.id}>
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
        <Flex direction={{ default: 'row' }}>
          <FlexItem
            data-test="issues-list-item-severity"
            style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}
          >
            {severityIcon(issue.severity)}
          </FlexItem>
          <FlexItem>{capitalize(issue.severity)}</FlexItem>
        </Flex>
      </TableData>

      <TableData className={issuesTableColumnClasses.status}>
        <IssueStatus locked={issue.state === IssueState.RESOLVED} />
      </TableData>

      <TableData className={issuesTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesTableColumnClasses.description}>
        <Truncate modalTitle="Full description" content={issue.description ?? '-'} />
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
