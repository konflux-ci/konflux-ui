import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { StatusBox } from '../../../shared/components/status-box/StatusBox';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import SnapshotPipelineRunsList from './SnapshotPipelineRunsList';

const SnapshotPipelineRunTab: React.FC = () => {
  const { snapshotName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineRuns, loaded, LoadError, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
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

  React.useEffect(() => {
    if (loaded && pipelineRuns.length === 0 && getNextPage) {
      getNextPage();
    }
  }, [getNextPage, loaded, pipelineRuns.length]);

  const sortedPipelineRuns = React.useMemo(
    () =>
      (pipelineRuns ?? [])
        .slice()
        .sort(
          (a, b) =>
            +new Date(b.metadata.creationTimestamp) - +new Date(a.metadata.creationTimestamp),
        ),
    [pipelineRuns],
  );

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
