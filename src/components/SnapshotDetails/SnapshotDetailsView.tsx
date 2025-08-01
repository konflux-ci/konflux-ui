import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { SnapshotLabels } from '../../consts/snapshots';
import { usePipelineRun } from '../../hooks/usePipelineRuns';
import { useSnapshot } from '../../hooks/useSnapshots';
import { HttpError } from '../../k8s/error';
import { SNAPSHOT_DETAILS_PATH, SNAPSHOT_LIST_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { createCommitObjectFromPLR } from '../../utils/commits-utils';
import CommitLabel from '../Commits/commit-label/CommitLabel';
import { DetailsPage } from '../DetailsPage';

const SnapshotDetailsView: React.FC = () => {
  const namespace = useNamespace();
  const { snapshotName, applicationName } = useParams<RouterParams>();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [snapshot, loaded, snapshotError] = useSnapshot(namespace, snapshotName);

  const buildPipelineName = React.useMemo(
    () =>
      loaded && !snapshotError && snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshot, loaded, snapshotError],
  );

  const [buildPipelineRun, plrLoaded, plrLoadError] = usePipelineRun(
    snapshot?.metadata?.namespace,
    buildPipelineName,
  );

  const commit = React.useMemo(
    () => plrLoaded && !plrLoadError && createCommitObjectFromPLR(buildPipelineRun),
    [plrLoaded, plrLoadError, buildPipelineRun],
  );

  if (snapshotError || (loaded && !snapshot)) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(
          snapshotError ? (snapshotError as { code: number }).code : 404,
        )}
        title="Snapshot not found"
        body="No such snapshot"
      />
    );
  }

  if (!plrLoadError && !plrLoaded && !loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (snapshot?.metadata) {
    return (
      <DetailsPage
        headTitle={snapshot.metadata.name}
        breadcrumbs={[
          ...applicationBreadcrumbs,
          {
            path: SNAPSHOT_LIST_PATH.createPath({
              workspaceName: namespace,
              applicationName,
            }),
            name: 'Snapshots',
          },
          {
            path: SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              snapshotName,
            }),
            name: snapshot.metadata.name,
          },
        ]}
        title={
          <>
            <Text component={TextVariants.h2} data-test="snapshot-name">
              {snapshotName}
            </Text>
            {commit?.sha && (
              <>
                <Text component={TextVariants.p} data-test="snapshot-header-details">
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
                </Text>
              </>
            )}
          </>
        }
        baseURL={SNAPSHOT_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          snapshotName,
        })}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'pipelineruns',
            label: 'Pipeline runs',
          },
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
