import React from 'react';
import { useParams } from 'react-router-dom';
import { IntegrationTestLabels } from '~/components/IntegrationTests/IntegrationTestForm/types';
import PipelineRunEmptyStateV2 from '~/components/PipelineRun/PipelineRunEmptyStateV2';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestPipelineRunTab from './IntegrationTestPipelineRunTab';

export const IntegrationTestPipelineRunTabByGroup: React.FC = () => {
  const namespace = useNamespace();
  const { groupName, integrationTestName } = useParams<RouterParams>();

  const [pipelineRuns, loaded, error, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.COMPONENT_GROUP]: groupName ?? '',
            [IntegrationTestLabels.SCENARIO]: integrationTestName ?? '',
          },
        },
      }),
      [groupName, integrationTestName],
    ),
  );

  return (
    // TODO: use new PLR List Page / Details page which will
    // be implemented in https://redhat.atlassian.net/browse/KFLUXUI-1663
    <IntegrationTestPipelineRunTab
      pipelineRuns={pipelineRuns}
      loaded={loaded}
      error={error}
      getNextPage={getNextPage}
      nextPageProps={nextPageProps}
      persistedColumnKey={`integration-test-pipeline-runs-columns-${groupName}-${integrationTestName}`}
      PipelineRunEmptyState={() => <PipelineRunEmptyStateV2 />}
    />
  );
};

export default IntegrationTestPipelineRunTabByGroup;
