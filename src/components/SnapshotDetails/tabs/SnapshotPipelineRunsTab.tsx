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
      snapshotLoaded && !snapshotLoadErr
        ? snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL]
        : undefined,
    [snapshotLoaded, snapshotLoadErr, snapshot],
  );
  const [buildPipelineRun, buildPLRLoaded, buildPLRError] = usePipelineRunV2(
    snapshot?.metadata?.namespace,
    buildPipelineRunName,
  );

  const [testPipelineRuns, testPLRLoaded, testPLRError, getNextPage, nextPageProps] =
    usePipelineRunsV2(
      snapshot?.metadata?.namespace,
      React.useMemo(
        () => ({
          selector: {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              [PipelineRunLabel.SNAPSHOT]: snapshotName,
            },
          },
        }),
        [applicationName, snapshotName],
      ),
    );

  const sortedPipelineRuns = React.useMemo(() => {
    const allPipelineRuns = [...(testPipelineRuns ?? []), buildPipelineRun].filter(Boolean);
    return allPipelineRuns
      .slice()
      .sort(
        (a, b) => +new Date(b.metadata.creationTimestamp) - +new Date(a.metadata.creationTimestamp),
      );
  }, [testPipelineRuns, buildPipelineRun]);

  const allLoaded = testPLRLoaded && (buildPLRLoaded || !buildPipelineRunName);
  const combinedError = snapshotLoadErr || testPLRError || buildPLRError;

  if (combinedError) {
    return <StatusBox loadError={combinedError} loaded={allLoaded} />;
  }

  if (!allLoaded && sortedPipelineRuns.length === 0) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (allLoaded && (!sortedPipelineRuns || sortedPipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  return (
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <SnapshotPipelineRunsList
        snapshotPipelineRuns={sortedPipelineRuns}
        loaded={allLoaded}
        applicationName={applicationName}
        getNextPage={getNextPage}
        nextPageProps={nextPageProps}
      />
    </FilterContextProvider>
  );
};

export default SnapshotPipelineRunTab;
