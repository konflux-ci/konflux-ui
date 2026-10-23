import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { VulnerabilitiesTabContent } from './VulnerabilitiesTabContent';

export const VulnerabilitiesTab: React.FC = () => {
  const { taskRunName = '' } = useParams();
  const namespace = useNamespace();
  const [taskRun, taskRunLoaded, taskRunError] = useTaskRunV2(namespace, taskRunName);

  if (!taskRunLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunLoaded, 'task run');
  }

  if (!taskRun) {
    return getErrorState({ code: 404, message: 'Task run not found' }, true, 'task run');
  }

  return <VulnerabilitiesTabContent taskRun={taskRun} />;
};
