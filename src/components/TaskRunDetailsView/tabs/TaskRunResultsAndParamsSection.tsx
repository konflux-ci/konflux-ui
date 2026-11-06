import * as React from 'react';
import { Divider } from '@patternfly/react-core';
import RunParamsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunParamsList';
import RunResultsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunResultsList';
import { runStatus } from '~/consts/pipelinerun';
import { TaskRunKind } from '~/types';
import { isTaskV1Beta1 } from '~/utils/pipeline-utils';

type Props = {
  taskRun: TaskRunKind;
  status: runStatus | null;
};

const TaskRunResultsAndParamsSection: React.FC<Props> = ({ taskRun, status }) => {
  const results = isTaskV1Beta1(taskRun) ? taskRun?.status?.taskResults : taskRun?.status?.results;
  const specParams = taskRun?.spec?.params;

  return (
    <>
      {results ? (
        <>
          <Divider style={{ paddingBlock: 'var(--pf-t--global--spacer--lg)' }} />
          <RunResultsList results={results} status={status} />
        </>
      ) : null}

      {specParams?.length && (
        <div style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
          <RunParamsList params={specParams} />
        </div>
      )}
    </>
  );
};

export default TaskRunResultsAndParamsSection;
