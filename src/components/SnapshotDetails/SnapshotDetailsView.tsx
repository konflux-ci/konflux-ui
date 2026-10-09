import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { SNAPSHOT_DETAILS_PATH, SNAPSHOT_LIST_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { createDetailsPageAction } from '~/components/DetailsPage/utils';
import SnapshotDetailsTitle from '~/components/SnapshotDetails/SnapshotDetailsTitle';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useSnapshot } from '~/hooks/useSnapshots';
import useTriggerReleaseAction from '~/shared/hooks/useTriggerReleaseAction';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';
import { downloadYamlAction } from '~/utils/common-utils';

const SnapshotDetailsView: React.FC = () => {
  const namespace = useNamespace();
  const { snapshotName, applicationName } = useParams<RouterParams>();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const snapshotPath = SNAPSHOT_DETAILS_PATH.createPath({
    workspaceName: namespace,
    applicationName,
    snapshotName,
  });
  const snapshotsPath = SNAPSHOT_LIST_PATH.createPath({
    workspaceName: namespace,
    applicationName,
  });

  const [snapshot, loaded, snapshotError, , , snapshotSource] = useSnapshot(
    namespace,
    snapshotName,
  );

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

  const { cta, isDisabled, disabledTooltip, key, label } = useTriggerReleaseAction(
    snapshot,
    snapshotSource,
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
          ...applicationBreadcrumbs,
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
          { key: 'pipelineruns', label: 'Pipeline runs' },
        ]}
        actions={[
          { key, label, isDisabled, disabledTooltip, onClick: cta },
          createDetailsPageAction(downloadYamlAction(snapshot)),
        ]}
      />
    );
  }

  return (
    <Bullseye>
      <Spinner data-test="spinner" />
    </Bullseye>
  );
};

export default SnapshotDetailsView;
