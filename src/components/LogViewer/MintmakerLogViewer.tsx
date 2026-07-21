import { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  ModalVariant,
  Spinner,
} from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PodGroupVersionKind } from '~/models/pod';
import { Timestamp } from '~/shared';
import LogsWrapperComponent from '~/shared/components/pipeline-run-logs/logs/LogsWrapperComponent';
import { LoadingBox } from '~/shared/components/status-box/StatusBox';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

import './MintmakerLogViewer.scss';

const MINTMAKER_TASK_NAME = 'build';

type MintmakerLogViewerProps = ComponentProps & {
  dependencyRun: PipelineRunKind;
};

export const MintmakerLogViewer: FC<PropsWithChildren<MintmakerLogViewerProps>> = ({
  dependencyRun,
}) => {
  const runName = dependencyRun.metadata?.name;
  const plrStatus = pipelineRunStatus(dependencyRun);
  const pipelineRunIsRunning = plrStatus === runStatus.Running;

  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRunsForPipelineRuns(
    MINTMAKER_NAMESPACE,
    runName,
    MINTMAKER_TASK_NAME,
  );

  const activeTaskRun = taskRuns?.[0];
  const podName = activeTaskRun?.status?.podName;

  const resource: WatchK8sResource | null = useMemo(
    () =>
      podName
        ? {
            name: podName,
            groupVersionKind: PodGroupVersionKind,
            namespace: dependencyRun.metadata.namespace,
            isList: false,
          }
        : null,
    [podName, dependencyRun.metadata.namespace],
  );

  const renderLogs = () => {
    if (taskRunsError) {
      return getErrorState(taskRunsError, taskRunsLoaded, 'logs');
    }

    if (!taskRunsLoaded) {
      return <LoadingBox />;
    }

    if (activeTaskRun && resource) {
      return <LogsWrapperComponent resource={resource} taskRun={activeTaskRun} />;
    }

    if (pipelineRunIsRunning && !activeTaskRun) {
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

  return (
    <Flex direction={{ default: 'column' }} className="mintmaker-log-viewer__content">
      <FlexItem>
        <DescriptionList data-test="mintmaker-run-details" columnModifier={{ default: '3Col' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Component</DescriptionListTerm>
            <DescriptionListDescription>
              {dependencyRun.metadata?.labels?.[PipelineRunLabel.MINTMAKER_COMPONENT_LABEL] ?? '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Mintmaker pipeline run</DescriptionListTerm>
            <DescriptionListDescription>
              {dependencyRun.metadata?.name ?? '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Started</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp timestamp={dependencyRun.status?.startTime ?? '-'} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }} className="mintmaker-log-viewer__body">
        {renderLogs()}
      </FlexItem>
    </Flex>
  );
};

export const mintmakerLogViewerLauncher = createModalLauncher(MintmakerLogViewer, {
  className: 'mintmaker-log-viewer',
  'data-test': 'view-mintmaker-logs-modal',
  variant: ModalVariant.large,
});

export const useMintmakerLogViewerModal = (dependencyRun: PipelineRunKind) => {
  const showModal = useModalLauncher();
  return useCallback(
    () => showModal(mintmakerLogViewerLauncher({ dependencyRun })),
    [dependencyRun, showModal],
  );
};
