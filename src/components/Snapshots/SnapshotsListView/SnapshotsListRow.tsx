import * as React from 'react';
import { Link } from 'react-router-dom';
import { Label, Truncate, pluralize } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { getCommitShortName } from '~/utils/commits-utils';
import { PipelineRunLabel, SnapshotLabels } from '../../../consts/pipelinerun';
import { COMPONENT_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '../../../routes/paths';
import { ExternalLink, RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import { useSnapshotActions } from './snapshot-actions';
import { snapshotsTableColumnClasses } from './SnapshotsListHeader';

type SnapshotsListRowProps = RowFunctionArgs<Snapshot> & {
  customData?: {
    applicationName: string;
    isColumnVisible: (columnKey: string) => boolean;
  };
};

const SnapshotsListRow: React.FC<React.PropsWithChildren<SnapshotsListRowProps>> = ({
  obj: snapshot,
  customData,
}) => {
  const namespace = useNamespace();
  const { applicationName, isColumnVisible } = customData || {};
  const actions = useSnapshotActions(snapshot);

  const componentCount = snapshot.spec.components?.length || 0;

  // Extract commit information from snapshot annotations using constants
  const commitSha = snapshot.metadata?.labels?.[SnapshotLabels.PAC_SHA_LABEL];
  const commitTitle = snapshot.metadata?.annotations?.[SnapshotLabels.PAC_SHA_TITLE_ANNOTATION];
  const commitUrl = snapshot.metadata?.annotations?.[SnapshotLabels.PAC_SHA_URL_ANNOTATION];
  const eventType = snapshot.metadata?.labels?.[SnapshotLabels.PAC_EVENT_TYPE_LABEL];
  const isPullRequest = eventType === 'pull_request';
  const prNumber = snapshot.metadata?.labels?.[SnapshotLabels.PAC_PULL_REQUEST_LABEL];
  const repoOrg = snapshot.metadata?.labels?.[SnapshotLabels.PAC_URL_ORG_LABEL];
  const repoName = snapshot.metadata?.labels?.[SnapshotLabels.PAC_URL_REPOSITORY_LABEL];
  const componentName = snapshot.metadata?.labels?.[PipelineRunLabel.COMPONENT];
  const repoUrl =
    snapshot.metadata?.annotations?.['pac.test.appstudio.openshift.io/source-repo-url'];
  const gitProvider = repoUrl?.includes('github') ? 'Github' : 'Gitlab';

  const renderTriggerType = () => {
    if (componentName && applicationName) {
      // Link to the component details page
      return (
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            componentName,
          })}
        >
          {componentName}
        </Link>
      );
    }

    // Fallback to repository name if no component is found
    if (repoOrg && repoName) {
      return `${repoOrg}/${repoName}`;
    }

    return '-';
  };

  const renderCommitInfo = () => {
    if (!commitSha || !commitUrl) return '-';

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
            <ExternalLink
              href={
                gitProvider === 'Github'
                  ? `https://github.com/${repoOrg}/${repoName}/pull/${prNumber}`
                  : `https://gitlab.com/${repoOrg}/${repoName}/-/merge_requests/${prNumber}`
              }
              text={<Truncate content={displayText} />}
              hideIcon={true}
            />{' '}
            <Label color="blue">
              <ExternalLink href={commitUrl} text={getCommitShortName(commitSha)} />
            </Label>
          </>
        ) : (
          <>
            {' '}
            <Label color="blue">
              <ExternalLink href={commitUrl} text={getCommitShortName(commitSha)} />
            </Label>
          </>
        )}
      </>
    );
  };

  const renderLatestSuccessfulRelease = () => {
    // Check if snapshot has status conditions
    if (!snapshot.status?.conditions || snapshot.status.conditions.length === 0) {
      return '-';
    }

    // Find the last successful release condition
    // Look for conditions where status is 'True' and reason is 'passed' (case-insensitive)
    const successfulReleaseCondition = snapshot.status.conditions.find(
      (condition) => condition.status === 'True' && condition.reason?.toLowerCase() === 'passed',
    );

    if (!successfulReleaseCondition || !successfulReleaseCondition.lastTransitionTime) {
      return '-';
    }

    // Display the timestamp of the last successful release
    return <Timestamp timestamp={successfulReleaseCondition.lastTransitionTime} />;
  };

  return (
    <>
      {isColumnVisible?.('name') && (
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
      )}
      {isColumnVisible?.('createdAt') && (
        <TableData
          data-test="snapshot-list-row-created-at"
          className={snapshotsTableColumnClasses.createdAt}
        >
          <Timestamp timestamp={snapshot.metadata.creationTimestamp ?? '-'} />
        </TableData>
      )}
      {isColumnVisible?.('components') && (
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
      )}
      {isColumnVisible?.('trigger') && (
        <TableData
          data-test="snapshot-list-row-trigger"
          className={snapshotsTableColumnClasses.trigger}
        >
          {renderTriggerType()}
        </TableData>
      )}
      {isColumnVisible?.('reference') && (
        <TableData
          data-test="snapshot-list-row-reference"
          className={snapshotsTableColumnClasses.reference}
        >
          {renderCommitInfo()}
        </TableData>
      )}
      {isColumnVisible?.('latestSuccessfulRelease') && (
        <TableData
          data-test="snapshot-list-row-latest-successful-release"
          className={snapshotsTableColumnClasses.latestSuccessfulRelease}
        >
          {renderLatestSuccessfulRelease()}
        </TableData>
      )}
      {isColumnVisible?.('kebab') && (
        <TableData className={snapshotsTableColumnClasses.kebab}>
          <ActionMenu actions={actions} />
        </TableData>
      )}
    </>
  );
};

export default SnapshotsListRow;
