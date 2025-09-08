import * as React from 'react';
import { Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { COMMIT_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '../../../routes/paths';
import { TableData, Timestamp } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit, PipelineRunKind } from '../../../types';
import { createRepoBranchURL, getCommitSha, statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
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
  pipelineRuns: PipelineRunKind[];
}

const CommitsListRow: React.FC<React.PropsWithChildren<CommitsListRowProps>> = ({
  obj,
  visibleColumns,
  pipelineRuns,
}) => {
  const actions = useCommitActions(obj);
  const namespace = useNamespace();

  const status = React.useMemo<runStatus>(() => {
    const plrsForCommit = pipelineRuns
      ?.filter((plr) => getCommitSha(plr) === obj.sha)
      ?.sort(
        (a, b) => new Date(b.status?.startTime).getTime() - new Date(a.status?.startTime).getTime(),
      );

    const plrStatus = pipelineRunStatus(plrsForCommit?.[0]);
    if (statuses.includes(plrStatus)) {
      return plrStatus;
    }
    return runStatus.Unknown;
  }, [obj.sha, pipelineRuns]);

  const prNumber = obj.isPullRequest ? `#${obj.pullRequestNumber}` : '';

  const columnsToShow = visibleColumns || DEFAULT_VISIBLE_COMMIT_COLUMNS;

  // Use dynamic classes based on visible columns
  const columnClasses = visibleColumns
    ? getDynamicCommitsColumnClasses(visibleColumns)
    : commitsTableColumnClasses;

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
          {obj.components.length > 0
            ? obj.components.map((c) => (
                <Link
                  key={c}
                  to={COMPONENT_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: obj.application,
                    componentName: c.trim(),
                  })}
                >
                  {c.trim()}
                </Link>
              ))
            : '-'}
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
