import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { getErrorState } from '~/shared/utils/error-utils';
import type { TaskRunKind } from '~/types';
import { groupRowsByCve } from './roxctl-utils';
import type { RoxctlCveTableRow } from './types';
import { useRoxctlCveReport } from './useRoxctlCveReport';
import { VulnerabilitiesTable } from './VulnerabilitiesTable';

export type VulnerabilitiesContext = 'pipelineRun' | 'taskRun';

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

const TASK_RUN_NO_SCAN_DATA_COPY = {
  title: 'No vulnerability scan found',
  body: 'No vulnerability scan data is available for this task run.',
};

type VulnerabilitiesTabContentProps = {
  taskRun: TaskRunKind | undefined;
  taskRunLoaded: boolean;
  taskRunError?: unknown;
  context: VulnerabilitiesContext;
  isAwaitingRoxctlTaskRun?: boolean;
  isRoxctlScanSkipped?: boolean;
};

export const VulnerabilitiesTabContent: React.FC<VulnerabilitiesTabContentProps> = ({
  taskRun,
  taskRunLoaded,
  taskRunError,
  context,
  isAwaitingRoxctlTaskRun = false,
  isRoxctlScanSkipped = false,
}) => {
  const { data, isLoading, error } = useRoxctlCveReport(taskRunLoaded ? taskRun : undefined);

  const groupedData: RoxctlCveTableRow[] = React.useMemo(() => groupRowsByCve(data), [data]);

  if (!taskRunLoaded || isLoading) {
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
    const emptyStateCopy =
      context === 'pipelineRun' && isRoxctlScanSkipped
        ? PIPELINE_SCAN_SKIPPED_COPY
        : context === 'pipelineRun' && isAwaitingRoxctlTaskRun
          ? PIPELINE_AWAITING_SCAN_COPY
          : context === 'pipelineRun'
            ? PIPELINE_NO_SCAN_DATA_COPY
            : TASK_RUN_NO_SCAN_DATA_COPY;

    return (
      <PageSection>
        <EmptyState
          data-test="vulnerabilities-unavailable"
          headingLevel="h4"
          icon={SearchIcon}
          titleText={emptyStateCopy.title}
          variant={EmptyStateVariant.full}
        >
          <EmptyStateBody>{emptyStateCopy.body}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return getErrorState(error, !isLoading, 'vulnerabilities');
  }

  return (
    <PageSection data-test="vulnerabilities-tab">
      <VulnerabilitiesTable data={groupedData} />
    </PageSection>
  );
};
