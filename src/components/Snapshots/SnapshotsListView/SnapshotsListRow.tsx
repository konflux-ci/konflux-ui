import * as React from 'react';
import { Link } from 'react-router-dom';
import { pluralize, Tooltip } from '@patternfly/react-core';
import { SnapshotLabels, snapshotsTableColumnClasses } from '../../../consts/snapshots';
import { SNAPSHOT_DETAILS_PATH } from '../../../routes/paths';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
import { getTriggerColumnData } from '../../../utils/trigger-column-utils';
import { useSnapshotActions } from './snapshot-actions';
import { SnapshotsListRowProps } from './types';

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
  const eventType = snapshot.metadata?.labels?.[SnapshotLabels.PAC_EVENT_TYPE_LABEL];
  const prNumber = snapshot.metadata?.labels?.[SnapshotLabels.PAC_PULL_REQUEST_LABEL];
  const repoOrg = snapshot.metadata?.labels?.[SnapshotLabels.PAC_URL_ORG_LABEL];
  const repoName = snapshot.metadata?.labels?.[SnapshotLabels.PAC_URL_REPOSITORY_LABEL];
  const repoUrl =
    snapshot.metadata?.annotations?.['pac.test.appstudio.openshift.io/source-repo-url'];
  const gitProvider = repoUrl?.includes('github') ? 'Github' : 'Gitlab';

  const renderReferenceColumnData = () => {
    return getTriggerColumnData({
      gitProvider: gitProvider === 'Github' ? 'github' : 'gitlab',
      repoOrg,
      repoURL: repoName,
      prNumber,
      eventType,
      commitId: commitSha,
    });
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
            <Tooltip
              content={snapshot.spec.components?.map((component) => component.name).join(', ')}
            >
              <Link
                to={`${SNAPSHOT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  snapshotName: snapshot.metadata.name,
                })}#snapshot-components`}
              >
                {pluralize(componentCount, 'Component')}
              </Link>
            </Tooltip>
          ) : (
            '-'
          )}
        </TableData>
      )}
      {isColumnVisible?.('reference') && (
        <TableData
          data-test="snapshot-list-row-reference"
          className={snapshotsTableColumnClasses.reference}
        >
          {renderReferenceColumnData()}
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
