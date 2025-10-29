import * as React from 'react';
import { Button, Flex, FlexItem, Modal, ModalVariant, capitalize } from '@patternfly/react-core';
import { Issue, IssueState } from '~/kite/issue-type';
import { RowFunctionArgs, TableData, Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { IssueStatus } from '../IssueStatus';
import { issuesTableColumnClasses } from './IssuesListHeader';
import { severityIcon } from './utils/issue-utils';

export type IssueListRowCustomData = {
  onToggle?: (issueId: string) => void;
};

const IssuesListRow: React.FC<RowFunctionArgs<Issue, IssueListRowCustomData>> = ({
  obj: issue,
  customData,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleModalToggle = () => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };
  const handleComponentClick = () => {
    if (customData?.onToggle) {
      customData.onToggle(issue.id);
    }
  };

  const links =
    issue.links?.map((link, index) => (
      <FlexItem key={`${link.id}-${index}`}>
        <ExternalLink href={link.url}>{link.title}</ExternalLink>
      </FlexItem>
    )) ?? [];

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
        {severityIcon(issue.severity)} {capitalize(issue.severity)}
      </TableData>

      <TableData className={issuesTableColumnClasses.status}>
        <IssueStatus locked={issue.state === IssueState.RESOLVED} />
      </TableData>

      <TableData className={issuesTableColumnClasses.createdOn}>
        <Timestamp timestamp={issue.createdAt} />
      </TableData>

      <TableData className={issuesTableColumnClasses.reason}>{issue.description ?? '-'}</TableData>

      <TableData className={issuesTableColumnClasses.usefulLinks}>
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

export default IssuesListRow;
