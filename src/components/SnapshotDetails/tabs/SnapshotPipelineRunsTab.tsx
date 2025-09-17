import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { StatusBox } from '../../../shared/components/status-box/StatusBox';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import SnapshotPipelineRunsList from './SnapshotPipelineRunsList';

const SnapshotPipelineRunTab: React.FC = () => {
  const { snapshotName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineRuns, loaded, LoadError, getNextPage, nextPageProps] = usePipelineRuns(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: { [PipelineRunLabel.APPLICATION]: applicationName },
        },
      }),
      [applicationName],
    ),
  );

  const SnapshotPipelineRuns = React.useMemo(() => {
    if (loaded && !LoadError) {
      return pipelineRuns.filter(
        (plr) =>
          (plr.metadata?.annotations &&
            plr.metadata.annotations[PipelineRunLabel.SNAPSHOT] === snapshotName) ||
          (plr.metadata?.labels && plr.metadata.labels[PipelineRunLabel.SNAPSHOT] === snapshotName),
      );
    }
    return [];
  }, [loaded, LoadError, pipelineRuns, snapshotName]);

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

  if (LoadError) {
    <StatusBox loadError={LoadError} loaded={loaded} />;
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
