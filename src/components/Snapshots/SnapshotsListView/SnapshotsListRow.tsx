import * as React from 'react';
import { Link } from 'react-router-dom';
import { pluralize } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { NotStartedIcon } from '@patternfly/react-icons/dist/esm/icons/not-started-icon';
import { SNAPSHOT_DETAILS_PATH } from '../../../routes/paths';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import CommitLabel from '../../Commits/commit-label/CommitLabel';
import { CommitIcon } from '../../Commits/CommitIcon';
import { useSnapshotActions } from './snapshot-actions';
import { snapshotsTableColumnClasses } from './SnapshotsListHeader';

import '../../Commits/CommitsListPage/CommitsListRow.scss';

type SnapshotsListRowProps = RowFunctionArgs<Snapshot, { applicationName: string }>;

const SnapshotsListRow: React.FC<React.PropsWithChildren<SnapshotsListRowProps>> = ({
  obj: snapshot,
  customData,
}) => {
  const namespace = useNamespace();
  const { applicationName } = customData || {};
  const actions = useSnapshotActions(snapshot);

  const componentCount = snapshot.spec.components?.length || 0;

  // Extract commit information from snapshot annotations
  const commitSha = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/sha'];
  const commitTitle = snapshot.metadata?.annotations?.['pac.test.appstudio.openshift.io/sha-title'];
  const commitUrl = snapshot.metadata?.annotations?.['pac.test.appstudio.openshift.io/sha-url'];
  const gitProvider = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/git-provider'];
  const eventType = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/event-type'];
  const isPullRequest = eventType === 'pull_request';
  const prNumber = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/pull-request'];
  const repoOrg = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/url-org'];
  const repoName = snapshot.metadata?.labels?.['pac.test.appstudio.openshift.io/url-repository'];

  const renderCommitInfo = () => {
    if (!commitSha || !commitUrl) return '-';

    // Format display text as "owner/repo/pull/39" for PRs or "owner/repo" for commits
    let displayText = '';
    if (repoOrg && repoName) {
      if (isPullRequest && prNumber) {
        displayText = `${repoOrg}/${repoName}/pull/${prNumber}`;
      } else {
        displayText = `${repoOrg}/${repoName}`;
      }
    } else {
      // Fallback to commit title or short SHA
      displayText = commitTitle || commitSha.substring(0, 7);
    }

    return (
      <>
        <CommitIcon isPR={isPullRequest} className="sha-title-icon" />
        {isPullRequest ? (
          <>
            <ExternalLink href={commitUrl} text={displayText} />{' '}
            <CommitLabel gitProvider={gitProvider} sha={commitSha} shaURL={commitUrl} />
          </>
        ) : (
          <>
            {' '}
            <CommitLabel gitProvider={gitProvider} sha={commitSha} shaURL={commitUrl} />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <TableData data-test="snapshot-list-row-name" className={snapshotsTableColumnClasses.name}>
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            snapshotName: snapshot.metadata.name,
          })}
        >
          {snapshot.metadata.name}
        </Link>
      </TableData>
      <TableData
        data-test="snapshot-list-row-created-at"
        className={snapshotsTableColumnClasses.createdAt}
      >
        <Timestamp timestamp={snapshot.metadata.creationTimestamp ?? '-'} />
      </TableData>
      <TableData
        data-test="snapshot-list-row-components"
        className={snapshotsTableColumnClasses.components}
      >
        {componentCount > 0 ? (
          <Link
            to={`${SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              snapshotName: snapshot.metadata.name,
            })}#snapshot-components`}
          >
            {pluralize(componentCount, 'Component')}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        data-test="snapshot-list-row-trigger-commit"
        className={snapshotsTableColumnClasses.triggerCommit}
      >
        {renderCommitInfo()}
      </TableData>
      <TableData
        data-test="snapshot-list-row-status"
        className={snapshotsTableColumnClasses.status}
      >
        {snapshot.status?.conditions?.some(
          (condition) => condition.type === 'AutoReleased' && condition.status === 'True',
        ) ? (
          <>
            <CheckCircleIcon color="green" /> Released
          </>
        ) : (
          <>
            <NotStartedIcon /> Not released
          </>
        )}
      </TableData>
      <TableData data-test="snapshot-list-row-kebab" className={snapshotsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SnapshotsListRow;
