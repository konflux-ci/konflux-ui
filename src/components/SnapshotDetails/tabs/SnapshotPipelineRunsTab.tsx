import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { getErrorMessage } from '~/components/ImportForm/error-utils';
import { SnapshotLabels } from '~/consts/snapshots';
import { useSnapshot } from '~/hooks/useSnapshots';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRun, usePipelineRuns } from '../../../hooks/usePipelineRuns';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import SnapshotPipelineRunsList from './SnapshotPipelineRunsList';

const SnapshotPipelineRunTab: React.FC = () => {
  const { snapshotName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [snapshot, snapshotLoaded, snapshotError] = useSnapshot(namespace, snapshotName);

  // The build pipelinerun should be queried separately since it will be the only pipelinerun
  // created before the snapshot
  const buildPipelineName = React.useMemo(
    () =>
      snapshotLoaded && !snapshotError
        ? snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL]
        : undefined,
    [snapshot, snapshotLoaded, snapshotError],
  );

  const [buildPipelineRun] = usePipelineRun(namespace, buildPipelineName);

  const [pipelineRuns, loaded, LoadError, getNextPage, nextPageProps] = usePipelineRuns(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          // Test PipelineRuns are always created after the Snapshot, and the Build PipelineRun is already fetched
          filterByCreationTimestampAfter:
            snapshotLoaded && !snapshotError ? snapshot?.metadata?.creationTimestamp : '',
          matchLabels: { [PipelineRunLabel.APPLICATION]: applicationName },
        },
      }),
      [applicationName, snapshot?.metadata?.creationTimestamp, snapshotLoaded, snapshotError],
    ),
  );

  const SnapshotPipelineRuns = React.useMemo(() => {
    const allPlrs = buildPipelineRun != null ? [buildPipelineRun, ...pipelineRuns] : pipelineRuns;
    if (loaded && !LoadError) {
      return allPlrs.filter(
        (plr) =>
          (plr.metadata?.annotations &&
            plr.metadata.annotations[PipelineRunLabel.SNAPSHOT] === snapshotName) ||
          (plr.metadata?.labels && plr.metadata.labels[PipelineRunLabel.SNAPSHOT] === snapshotName),
      );
    }
    return [];
  }, [loaded, LoadError, pipelineRuns, snapshotName, buildPipelineRun]);

  React.useEffect(() => {
    if (loaded && SnapshotPipelineRuns.length === 0 && getNextPage) {
      getNextPage();
    }
  }, [getNextPage, loaded, SnapshotPipelineRuns.length]);

  SnapshotPipelineRuns?.sort(
    (app1, app2) =>
      +new Date(app2.metadata.creationTimestamp) - +new Date(app1.metadata.creationTimestamp),
  );

  if (!loaded && pipelineRuns.length === 0) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  const errorMessage = getErrorMessage(LoadError);
  if (errorMessage) {
    return errorMessage;
  }

  if (loaded && (!SnapshotPipelineRuns || SnapshotPipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  return (
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <SnapshotPipelineRunsList
        snapshotPipelineRuns={SnapshotPipelineRuns}
        loaded={loaded}
        applicationName={applicationName}
        getNextPage={getNextPage}
        nextPageProps={nextPageProps}
      />
    </FilterContextProvider>
  );
};

export default SnapshotPipelineRunTab;
