import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Popover, Stack, StackItem, Truncate } from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { COMMIT_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '../../../routes/paths';
import { TableData, Timestamp } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit } from '../../../types';
import { createRepoBranchURL, statuses } from '../../../utils/commits-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { useCommitActions } from '../commit-actions';
import CommitLabel from '../commit-label/CommitLabel';
import { CommitIcon } from '../CommitIcon';
import {
  CommitColumnKeys,
  commitsTableColumnClasses,
  DEFAULT_VISIBLE_COMMIT_COLUMNS,
  COMMIT_COLUMN_ORDER,
  getDynamicCommitsColumnClasses,
} from './commits-columns-config';

import './CommitsListRow.scss';

interface CommitsListRowProps {
  obj: Commit;
  visibleColumns?: Set<CommitColumnKeys>;
  status: runStatus;
}

const CommitsListRow: React.FC<React.PropsWithChildren<CommitsListRowProps>> = ({
  obj,
  visibleColumns,
  status,
}) => {
  const actions = useCommitActions(obj);
  const namespace = useNamespace();

  const prNumber = obj.isPullRequest ? `#${obj.pullRequestNumber}` : '';

  const columnsToShow = visibleColumns || DEFAULT_VISIBLE_COMMIT_COLUMNS;

  // Use dynamic classes based on visible columns
  const columnClasses = visibleColumns
    ? getDynamicCommitsColumnClasses(visibleColumns)
    : commitsTableColumnClasses;

  const getComponentLink = React.useCallback(
    (component: string) => (
      <Link
        key={component}
        to={COMPONENT_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName: obj.application,
          componentName: component.trim(),
        })}
      >
        {component.trim()}
      </Link>
    ),
    [namespace, obj.application],
  );

  const compCount = obj.components.length;
  const visibleComponents = React.useMemo(() => obj.components.slice(0, 3), [obj.components]);
  const hiddenComponents = React.useMemo(() => obj.components.slice(3), [obj.components]);

  const popoverBodyContent = React.useMemo(
    () =>
      hiddenComponents.map((comp) => <StackItem key={comp}>{getComponentLink(comp)}</StackItem>),
    [hiddenComponents, getComponentLink],
  );

  const columnComponents = {
    name: (
      <TableData key="name" className={columnClasses.name}>
        <CommitIcon isPR={obj.isPullRequest} className="sha-title-icon" />
        <Link
          to={COMMIT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: obj.application,
            commitName: obj.sha,
          })}
        >
          {prNumber} {obj.shaTitle}
        </Link>
        {obj.shaURL && (
          <>
            {' '}
            <CommitLabel gitProvider={obj.gitProvider} sha={obj.sha} shaURL={obj.shaURL} />
          </>
        )}
      </TableData>
    ),
    branch: (
      <TableData key="branch" className={columnClasses.branch}>
        {createRepoBranchURL(obj) ? (
          <ExternalLink href={createRepoBranchURL(obj)} text={`${obj.branch}`} />
        ) : (
          `${obj.branch || '-'}`
        )}
      </TableData>
    ),
    component: (
      <TableData key="component" className={columnClasses.component}>
        <div className="commits-component-list">
          {compCount > 0 ? (
            <>
              {visibleComponents.map((comp) => getComponentLink(comp))}
              {hiddenComponents.length > 0 && (
                <Popover
                  data-testid="more-components-popover"
                  aria-label="More commit components"
                  headerContent="More commit components"
                  bodyContent={
                    <Stack
                      className="commits-popover-stack"
                      style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                      }}
                    >
                      {popoverBodyContent}
                    </Stack>
                  }
                >
                  <Button variant="link" isInline>
                    {`${hiddenComponents.length} more`}
                  </Button>
                </Popover>
              )}
            </>
          ) : (
            '-'
          )}
        </div>
      </TableData>
    ),
    byUser: (
      <TableData key="byUser" className={columnClasses.byUser}>
        <Truncate content={obj.user ?? '-'} />
      </TableData>
    ),
    committedAt: (
      <TableData key="committedAt" className={columnClasses.committedAt}>
        <Timestamp timestamp={obj.creationTime} />
      </TableData>
    ),
    status: (
      <TableData key="status" className={columnClasses.status}>
        {statuses.includes(status) ? <StatusIconWithText status={status} /> : '-'}
      </TableData>
    ),
  };

  return (
    <>
      {COMMIT_COLUMN_ORDER.filter((columnKey) => columnsToShow.has(columnKey)).map(
        (columnKey) => columnComponents[columnKey],
      )}
      <TableData className={columnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default CommitsListRow;
