import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { VulnerabilitiesTabContent } from './VulnerabilitiesTabContent';

export const VulnerabilitiesTab: React.FC = () => {
  const { taskRunName = '' } = useParams();
  const namespace = useNamespace();
  const [taskRun, taskRunLoaded] = useTaskRunV2(namespace, taskRunName);

  return (
    <VulnerabilitiesTabContent
      taskRun={taskRun ?? undefined}
      taskRunLoaded={taskRunLoaded}
      context="taskRun"
    />
  );
};
