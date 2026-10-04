import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import {
  GROUP_SNAPSHOT_DETAILS_PATH,
  GROUP_SNAPSHOT_LIST_PATH,
  SNAPSHOT_DETAILS_PATH,
  SNAPSHOT_LIST_PATH,
} from '~/routes/paths';
import { getErrorState } from '~/shared/utils/error-utils';
import { downloadYamlAction } from '~/utils/common-utils';
import { SnapshotLabels } from '../../consts/snapshots';
import { useSnapshot } from '../../hooks/useSnapshots';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import useTriggerReleaseAction from '../../shared/hooks/useTriggerReleaseAction';
import { useNamespace } from '../../shared/providers/Namespace';
import { createCommitObjectFromPLR } from '../../utils/commits-utils';
import { useApplicationBreadcrumbs } from '../Applications/breadcrumbs/breadcrumb-utils';
import CommitLabel from '../Commits/commit-label/CommitLabel';
import { DetailsPage } from '../DetailsPage';
import { createDetailsPageAction } from '../DetailsPage/utils';

const SnapshotDetailsView: React.FC = () => {
  const namespace = useNamespace();
  const { snapshotName, applicationName, groupName } = useParams<RouterParams>();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const groupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);
  const snapshotPath = groupName
    ? GROUP_SNAPSHOT_DETAILS_PATH.createPath({ workspaceName: namespace, groupName, snapshotName })
    : SNAPSHOT_DETAILS_PATH.createPath({ workspaceName: namespace, applicationName, snapshotName });
  const snapshotsPath = groupName
    ? GROUP_SNAPSHOT_LIST_PATH.createPath({ workspaceName: namespace, groupName })
    : SNAPSHOT_LIST_PATH.createPath({ workspaceName: namespace, applicationName });

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
          ...(groupName ? groupBreadcrumbs : applicationBreadcrumbs),
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
          <>
            <Content component={ContentVariants.h2} data-test="snapshot-name">
              {snapshotName}
            </Content>
            {plrLoaded && !plrLoadError && commit?.sha && (
              <>
                <Content component={ContentVariants.p} data-test="snapshot-header-details">
                  Triggered by {commit.shaTitle}{' '}
                  <CommitLabel
                    gitProvider={commit.gitProvider}
                    sha={commit.sha}
                    shaURL={commit.shaURL}
                  />{' '}
                  at{' '}
                  <Timestamp
                    timestamp={snapshot.metadata.creationTimestamp}
                    className="pf-u-display-inline"
                  />
                </Content>
              </>
            )}
          </>
        }
        baseURL={snapshotPath}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          ...(!groupName ? [{ key: 'pipelineruns', label: 'Pipeline runs' }] : []),
        ]}
        actions={[
          ...(!groupName ? [{ key, label, isDisabled, disabledTooltip, onClick: cta }] : []),
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
