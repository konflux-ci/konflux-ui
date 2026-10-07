import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { GROUP_SNAPSHOT_DETAILS_PATH, GROUP_SNAPSHOT_LIST_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { createDetailsPageAction } from '~/components/DetailsPage/utils';
import SnapshotDetailsTitle from '~/components/SnapshotDetails/SnapshotDetailsTitle';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useSnapshot } from '~/hooks/useSnapshots';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';
import { downloadYamlAction } from '~/utils/common-utils';

const GroupSnapshotDetailsView: React.FC = () => {
  const namespace = useNamespace();
  const { snapshotName, groupName } = useParams<RouterParams>();

  const groupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);
  const snapshotPath = GROUP_SNAPSHOT_DETAILS_PATH.createPath({
    workspaceName: namespace,
    groupName,
    snapshotName,
  });
  const snapshotsPath = GROUP_SNAPSHOT_LIST_PATH.createPath({
    workspaceName: namespace,
    groupName,
  });

  const [snapshot, loaded, snapshotError] = useSnapshot(namespace, snapshotName);

  const buildPipelineName = React.useMemo(
    () =>
      loaded && !snapshotError && snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshot, loaded, snapshotError],
  );

  const [buildPipelineRun, plrLoaded, plrLoadError] = usePipelineRunV2(
    snapshot?.metadata?.namespace,
    buildPipelineName,
  );

  const commit = React.useMemo(
    () => plrLoaded && !plrLoadError && createCommitObjectFromPLR(buildPipelineRun),
    [plrLoaded, plrLoadError, buildPipelineRun],
  );

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (snapshotError) {
    return getErrorState(snapshotError, loaded, 'snapshot');
  }

  if (snapshot?.metadata) {
    return (
      <DetailsPage
        headTitle={snapshot.metadata.name}
        featureFlags={['pipelineruns-kubearchive', 'taskruns-kubearchive']}
        breadcrumbs={[
          ...groupBreadcrumbs,
          {
            path: snapshotsPath,
            name: 'Snapshots',
          },
          {
            path: snapshotPath,
            name: snapshot.metadata.name,
          },
        ]}
        title={
          <SnapshotDetailsTitle
            name={snapshotName}
            creationTimestamp={snapshot.metadata.creationTimestamp}
            commit={commit || undefined}
          />
        }
        baseURL={snapshotPath}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
        ]}
        actions={[createDetailsPageAction(downloadYamlAction(snapshot))]}
      />
    );
  }

  return (
    <Bullseye>
      <Spinner data-test="spinner" />
    </Bullseye>
  );
};

export default GroupSnapshotDetailsView;
