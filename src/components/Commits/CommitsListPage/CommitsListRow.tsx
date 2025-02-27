import * as React from 'react';
import { Link } from 'react-router-dom';
import { COMMIT_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '../../../routes/paths';
import { RowFunctionArgs, TableData, Timestamp } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit } from '../../../types';
import { createRepoBranchURL, statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { useCommitActions } from '../commit-actions';
import CommitLabel from '../commit-label/CommitLabel';
import { CommitIcon } from '../CommitIcon';
import { commitsTableColumnClasses } from './CommitsListHeader';

import './CommitsListRow.scss';

const CommitsListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<Commit>>> = ({ obj }) => {
  const actions = useCommitActions(obj);
  const namespace = useNamespace();
  const status = pipelineRunStatus(obj.pipelineRuns[0]);

  const prNumber = obj.isPullRequest ? `#${obj.pullRequestNumber}` : '';
  return (
    <>
      <TableData className={commitsTableColumnClasses.name}>
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
      <TableData className={commitsTableColumnClasses.branch}>
        {createRepoBranchURL(obj) ? (
          <ExternalLink href={createRepoBranchURL(obj)} text={`${obj.branch}`} />
        ) : (
          `${obj.branch || '-'}`
        )}
      </TableData>
      <TableData className={commitsTableColumnClasses.component}>
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
      <TableData className={commitsTableColumnClasses.byUser}>{obj.user ?? '-'}</TableData>
      <TableData className={commitsTableColumnClasses.committedAt}>
        <Timestamp timestamp={obj.creationTime} />
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
