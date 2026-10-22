import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ActivePLRStatuses, PLRStatus } from '~/utils/plr-status-config';
import { VulnerabilitiesTabContent } from '../../VulnerabilitiesTab/VulnerabilitiesTabContent';

const PIPELINE_SCAN_SKIPPED_COPY = {
  title: 'Vulnerability scan skipped',
  body: 'The roxctl-scan task was skipped for this pipeline run.',
};

const PIPELINE_AWAITING_SCAN_COPY = {
  title: 'Waiting for vulnerability scan',
  body: 'The pipeline run is still in progress. The roxctl-scan task has not started yet.',
};

const PIPELINE_NO_SCAN_DATA_COPY = {
  title: 'No vulnerability scan found',
  body: 'No vulnerability scan data is available for this pipeline run.',
};

type VulnerabilityEmptyStateProps = {
  title: string;
  body: string;
};

const VulnerabilityEmptyState: React.FC<VulnerabilityEmptyStateProps> = ({ title, body }) => (
  <PageSection>
    <EmptyState
      data-test="vulnerabilities-unavailable"
      headingLevel="h4"
      icon={SearchIcon}
      titleText={title}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>{body}</EmptyStateBody>
    </EmptyState>
  </PageSection>
);

export const PipelineRunVulnerabilitiesTab: React.FC = () => {
  const { pipelineRunName = '' } = useParams();
  const namespace = useNamespace();
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] = usePipelineRunV2(
    namespace,
    pipelineRunName,
  );
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
    ROXCTL_SCAN_TASK,
  );
  const roxctlScanTaskRun = taskRuns[0];
  const isPipelineRunActive =
    !!pipelineRun && ActivePLRStatuses.includes(PLRStatus.registry.deriveStatus(pipelineRun));
  const hasRoxctlChildReference =
    pipelineRun?.status?.childReferences?.some(
      (ref) => ref.pipelineTaskName === ROXCTL_SCAN_TASK,
    ) ?? false;
  const isAwaitingRoxctlTaskRun = !roxctlScanTaskRun && isPipelineRunActive;
  const isRoxctlScanSkipped =
    !roxctlScanTaskRun &&
    (pipelineRun?.status?.skippedTasks?.some((task) => task.name === ROXCTL_SCAN_TASK) ?? false);

  if (!pipelineRunLoaded || !taskRunsLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run');
  }

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunsLoaded, 'task runs');
  }

  if (isAwaitingRoxctlTaskRun && hasRoxctlChildReference) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (!roxctlScanTaskRun) {
    const emptyStateCopy = isRoxctlScanSkipped
      ? PIPELINE_SCAN_SKIPPED_COPY
      : isAwaitingRoxctlTaskRun
        ? PIPELINE_AWAITING_SCAN_COPY
        : PIPELINE_NO_SCAN_DATA_COPY;

    return <VulnerabilityEmptyState {...emptyStateCopy} />;
  }

  return <VulnerabilitiesTabContent taskRun={roxctlScanTaskRun} />;
};
