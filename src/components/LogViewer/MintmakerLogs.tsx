import { useMemo } from 'react';
import { Alert, AlertActionLink, Bullseye, Flex, FlexItem, Spinner } from '@patternfly/react-core';
import { MINTMAKER_NAMESPACE, MINTMAKER_TASK_NAME } from '~/consts/constants';
import { runStatus } from '~/consts/pipelinerun';
import { useFeatureFlags, useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PodGroupVersionKind } from '~/models/pod';
import LogsWrapperComponent from '~/shared/components/pipeline-run-logs/logs/LogsWrapperComponent';
import { LoadingBox } from '~/shared/components/status-box/StatusBox';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

interface MintmakerLogsProps {
  dependencyRun: PipelineRunKind;
}

export const MintmakerLogs = ({ dependencyRun }: MintmakerLogsProps) => {
  const [, setFlag] = useFeatureFlags();
  const isKubeArchiveLogsOn = useIsOnFeatureFlag('kubearchive-logs');
  const runName = dependencyRun.metadata?.name;

  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRunsForPipelineRuns(
    MINTMAKER_NAMESPACE,
    runName ?? '', // useTaskRunsForPipelineRuns is disabled if the run name is empty
    MINTMAKER_TASK_NAME,
  );

  const activeTaskRun = taskRuns?.[0];
  const podName = activeTaskRun?.status?.podName;

  const plrStatus = pipelineRunStatus(dependencyRun);
  const pipelineRunIsRunning = plrStatus === runStatus.Running;

  const resource: WatchK8sResource | null = useMemo(
    () =>
      podName
        ? {
            name: podName,
            groupVersionKind: PodGroupVersionKind,
            namespace: MINTMAKER_NAMESPACE,
            isList: false,
          }
        : null,
    [podName],
  );

  if (!isKubeArchiveLogsOn) {
    return (
      <Bullseye>
        <Alert
          variant="warning"
          data-test="mintmaker-logs-alert"
          title="You must turn on the 'Use KubeArchive to fetch logs instead of Tekton' feature
            flag to view MintMaker logs."
          isInline
          actionLinks={
            <AlertActionLink onClick={() => setFlag('kubearchive-logs', true)}>
              Turn on KubeArchive logs
            </AlertActionLink>
          }
        />
      </Bullseye>
    );
  }

  if (taskRunsError) {
    return getErrorState(taskRunsError, taskRunsLoaded, 'logs');
  }

  if (!taskRunsLoaded) {
    return <LoadingBox />;
  }

  if (activeTaskRun && resource) {
    return <LogsWrapperComponent resource={resource} taskRun={activeTaskRun} />;
  }

  if (pipelineRunIsRunning && (!activeTaskRun || !resource)) {
    return (
      <Bullseye>
        <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Spinner size="lg" />
          </FlexItem>
          <FlexItem>No logs available yet. Waiting for the task to start...</FlexItem>
        </Flex>
      </Bullseye>
    );
  }

  return <Bullseye data-test="no-logs-found">No logs found</Bullseye>;
};
