import * as React from 'react';
import { Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { COMMIT_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '../../../routes/paths';
import { RowFunctionArgs, TableData, Timestamp } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit, PipelineRunKind } from '../../../types';
import { createRepoBranchURL, getCommitSha, statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus, runStatus } from '../../../utils/pipeline-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { useCommitActions } from '../commit-actions';
import CommitLabel from '../commit-label/CommitLabel';
import { CommitIcon } from '../CommitIcon';
import { commitsTableColumnClasses } from './CommitsListHeader';

import './CommitsListRow.scss';

type CommitsListRowProps = {
  commit: Commit;
  pipelineRuns: PipelineRunKind[];
};

const CommitsListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<CommitsListRowProps>>> = ({
  obj: { commit, pipelineRuns },
}) => {
  const actions = useCommitActions(commit);
  const namespace = useNamespace();

  const status = React.useMemo<runStatus>(() => {
    const plrsForCommit = pipelineRuns
      ?.filter((plr) => getCommitSha(plr) === commit.sha)
      ?.sort(
        (a, b) => new Date(b.status?.startTime).getTime() - new Date(a.status?.startTime).getTime(),
      );

    const plrStatus = pipelineRunStatus(plrsForCommit?.[0]);
    if (statuses.includes(plrStatus)) {
      return plrStatus;
    }
    return runStatus.Failed;
  }, [commit.sha, pipelineRuns]);

  const prNumber = commit.isPullRequest ? `#${commit.pullRequestNumber}` : '';
  return (
    <>
      <TableData className={commitsTableColumnClasses.name}>
        <CommitIcon isPR={commit.isPullRequest} className="sha-title-icon" />
        <Link
          to={COMMIT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: commit.application,
            commitName: commit.sha,
          })}
        >
          {prNumber} {commit.shaTitle}
        </Link>
        {commit.shaURL && (
          <>
            {' '}
            <CommitLabel gitProvider={commit.gitProvider} sha={commit.sha} shaURL={commit.shaURL} />
          </>
        )}
      </TableData>
      <TableData className={commitsTableColumnClasses.branch}>
        {createRepoBranchURL(commit) ? (
          <ExternalLink href={createRepoBranchURL(commit)} text={`${commit.branch}`} />
        ) : (
          `${commit.branch || '-'}`
        )}
      </TableData>
      <TableData className={commitsTableColumnClasses.component}>
        <div className="commits-component-list">
          {commit.components.length > 0
            ? commit.components.map((c) => (
                <Link
                  key={c}
                  to={COMPONENT_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: commit.application,
                    componentName: c.trim(),
                  })}
                >
                  {c.trim()}
                </Link>
              ))
            : '-'}
        </div>
      </TableData>
      <TableData className={commitsTableColumnClasses.byUser}>
        <Truncate content={commit.user ?? '-'} />
      </TableData>
      <TableData className={commitsTableColumnClasses.committedAt}>
        <Timestamp timestamp={commit.creationTime} />
      </TableData>
      <TableData className={commitsTableColumnClasses.status}>
        {statuses.includes(status) ? <StatusIconWithText status={status} /> : '-'}
      </TableData>
      <TableData className={commitsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default CommitsListRow;
