import * as React from 'react';
import { Link } from 'react-router-dom';
import { pluralize, Tooltip } from '@patternfly/react-core';
import { SNAPSHOT_DETAILS_PATH } from '../../../routes/paths';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { TriggerColumnData } from '../../../shared/components/trigger-column-data/trigger-column-data';
import { useNamespace } from '../../../shared/providers/Namespace';
import { createCommitObjectFromSnapshot } from '../../../utils/commits-utils';
import { useSnapshotActions } from './snapshot-actions';
import { snapshotsTableColumnClasses } from './SnapshotsListHeader';
import { SnapshotsListRowProps } from './types';

const SnapshotsListRow: React.FC<React.PropsWithChildren<SnapshotsListRowProps>> = ({
  obj: snapshot,
  customData,
}) => {
  const namespace = useNamespace();
  const { applicationName } = customData || {};
  const actions = useSnapshotActions(snapshot);

  const componentCount = snapshot.spec.components?.length || 0;

  const commit = createCommitObjectFromSnapshot(snapshot);

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
          <Tooltip
            content={
              <div>{snapshot.spec.components?.map((component) => component.name).join(', ')}</div>
            }
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
      <TableData
        data-test="snapshot-list-row-reference"
        className={snapshotsTableColumnClasses.reference}
      >
        <TriggerColumnData
          repoOrg={commit?.repoOrg}
          repoName={commit?.repoName}
          repoURL={commit?.repoURL}
          prNumber={commit?.pullRequestNumber}
          eventType={commit?.eventType}
          commitSha={commit?.sha}
          shaUrl={commit?.shaURL}
        />
      </TableData>
      <TableData className={snapshotsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SnapshotsListRow;
