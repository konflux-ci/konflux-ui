import React from 'react';
import { useParams } from 'react-router-dom';
import { IntegrationTestLabels } from '~/components/IntegrationTests/IntegrationTestForm/types';
import PipelineRunEmptyState from '~/components/PipelineRun/PipelineRunEmptyState';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestPipelineRunTab from './IntegrationTestPipelineRunTab';

export const IntegrationTestPipelineRunTabByApplication: React.FC = () => {
  const namespace = useNamespace();
  const { applicationName, integrationTestName } = useParams<RouterParams>();

  const [pipelineRuns, loaded, error, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName ?? '',
            [IntegrationTestLabels.SCENARIO]: integrationTestName ?? '',
          },
        },
      }),
      [applicationName, integrationTestName],
    ),
  );

  return (
    <IntegrationTestPipelineRunTab
      pipelineRuns={pipelineRuns}
      loaded={loaded}
      error={error}
      getNextPage={getNextPage}
      nextPageProps={nextPageProps}
      persistedColumnKey={`integration-test-pipeline-runs-columns-${applicationName}-${integrationTestName}`}
      PipelineRunEmptyState={() => (
        <PipelineRunEmptyState applicationName={applicationName ?? ''} />
      )}
    />
  );
};

export default IntegrationTestPipelineRunTabByApplication;
