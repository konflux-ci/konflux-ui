import * as React from 'react';
import { Link } from 'react-router-dom';
import { COMPONENT_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '../../../routes/paths';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { TriggerColumnData } from '../../../shared/components/trigger-column-data/trigger-column-data';
import TruncatedLinkListWithPopover from '../../../shared/components/truncated-link-list-with-popover/TruncatedLinkListWithPopover';
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
  const { applicationName, getSource } = customData || {};
  const source = getSource?.(snapshot);
  const actions = useSnapshotActions(snapshot, source);

  const componentNames = React.useMemo(
    () => snapshot.spec.components?.map((c) => c.name) ?? [],
    [snapshot.spec.components],
  );

  const getComponentLink = React.useCallback(
    (component: string) => (
      <Link
        key={component}
        to={COMPONENT_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          componentName: component.trim(),
        })}
      >
        {component.trim()}
      </Link>
    ),
    [namespace, applicationName],
  );

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
        <TruncatedLinkListWithPopover
          items={componentNames}
          renderItem={getComponentLink}
          popover={{
            header: 'More snapshot components',
            ariaLabel: 'More snapshot components',
            moreText: (count: number) => `${count} more`,
            dataTestIdPrefix: 'more-snapshot-components-popover',
          }}
        />
      </TableData>
      <TableData
        data-test="snapshot-list-row-commit-message"
        className={snapshotsTableColumnClasses.commitMessage}
      >
        {commit?.shaTitle || '-'}
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
