import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { SnapshotLabels } from '~/consts/snapshots';
import { useSnapshot } from '~/hooks/useSnapshots';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRunsV2, usePipelineRunV2 } from '../../../hooks/usePipelineRunsV2';
import { StatusBox } from '../../../shared/components/status-box/StatusBox';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import SnapshotPipelineRunsList from './SnapshotPipelineRunsList';

const SnapshotPipelineRunTab: React.FC = () => {
  const { snapshotName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [snapshot, snapshotLoaded, snapshotLoadErr] = useSnapshot(namespace, snapshotName);
  const buildPipelineRunName = React.useMemo(
    () =>
      snapshotLoaded &&
      !snapshotLoadErr &&
      snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshotLoaded, snapshotLoadErr, snapshot],
  );
  const [buildPipelineRun] = usePipelineRunV2(
    snapshot?.metadata?.namespace,
    buildPipelineRunName ?? undefined,
  );

  const [pipelineRuns, loaded, LoadError, getNextPage, nextPageProps] = usePipelineRunsV2(
    snapshot?.metadata?.namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName,
            [PipelineRunLabel.SNAPSHOT]: snapshotName,
          },
        },
        limit: 30,
      }),
      [applicationName, snapshotName],
    ),
  );

  const sortedPipelineRuns = React.useMemo(() => {
    const allPipelineRuns = [...(pipelineRuns ?? []), buildPipelineRun].filter(Boolean);
    return allPipelineRuns
      .slice()
      .sort(
        (a, b) => +new Date(b.metadata.creationTimestamp) - +new Date(a.metadata.creationTimestamp),
      );
  }, [pipelineRuns, buildPipelineRun]);

  if (!loaded && sortedPipelineRuns.length === 0) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (LoadError) {
    <StatusBox loadError={LoadError} loaded={loaded} />;
  }

  if (loaded && (!sortedPipelineRuns || sortedPipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  return (
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <SnapshotPipelineRunsList
        snapshotPipelineRuns={sortedPipelineRuns}
        loaded={loaded}
        applicationName={applicationName}
        getNextPage={getNextPage}
        nextPageProps={nextPageProps}
      />
    </FilterContextProvider>
  );
};

export default SnapshotPipelineRunTab;
