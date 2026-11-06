import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Flex, FlexItem, Spinner, Title } from '@patternfly/react-core';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { taskRunStatus } from '~/utils/pipeline-utils';
import TaskRunDetailsSection from './TaskRunDetailsSection';
import TaskRunMetadataSection from './TaskRunMetadataSection';
import TaskRunResultsAndParamsSection from './TaskRunResultsAndParamsSection';

const TaskRunDetailsTab: React.FC = () => {
  const { taskRunName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun, loaded, error] = useTaskRunV2(namespace, taskRunName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="lg" />
      </Bullseye>
    );
  }

  const status = !error ? taskRunStatus(taskRun) : null;

  return (
    <>
      <Title headingLevel="h4" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-lg" size="lg">
        Task run details
      </Title>
      {!error && (
        <Flex>
          <Flex flex={{ default: 'flex_3' }}>
            <FlexItem>
              <TaskRunMetadataSection taskRun={taskRun} />
            </FlexItem>
          </Flex>

          <Flex flex={{ default: 'flex_3' }}>
            <FlexItem>
              <TaskRunDetailsSection
                taskRun={taskRun}
                taskRunName={taskRunName}
                applicationName={applicationName}
                namespace={namespace}
                status={status}
              />
            </FlexItem>
          </Flex>

          <TaskRunResultsAndParamsSection taskRun={taskRun} status={status} />
        </Flex>
      )}
    </>
  );
};

export default TaskRunDetailsTab;
