import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import type { TaskRunKind } from '~/types';
import { groupRowsByCve } from './roxctl-utils';
import type { RoxctlCveTableRow } from './types';
import { useRoxctlCveReport } from './useRoxctlCveReport';
import { VulnerabilitiesTable } from './VulnerabilitiesTable';

export type VulnerabilitiesContext = 'pipelineRun' | 'taskRun';

const UNAVAILABLE_MESSAGES: Record<VulnerabilitiesContext, string> = {
  pipelineRun: 'This pipeline run does not include a roxctl-scan task run.',
  taskRun: 'No vulnerability scan data is available for this task run.',
};

type VulnerabilitiesTabContentProps = {
  taskRun: TaskRunKind | undefined;
  taskRunLoaded: boolean;
  context: VulnerabilitiesContext;
};

export const VulnerabilitiesTabContent: React.FC<VulnerabilitiesTabContentProps> = ({
  taskRun,
  taskRunLoaded,
  context,
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

  if (!taskRun) {
    return (
      <PageSection>
        <EmptyState
          data-test="vulnerabilities-unavailable"
          headingLevel="h4"
          icon={SearchIcon}
          titleText="No vulnerability scan found"
          variant={EmptyStateVariant.full}
        >
          <EmptyStateBody>{UNAVAILABLE_MESSAGES[context]}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <EmptyState
          data-test="vulnerabilities-error"
          headingLevel="h4"
          icon={ExclamationCircleIcon}
          titleText="Unable to load vulnerabilities"
          variant={EmptyStateVariant.full}
        >
          <EmptyStateBody>
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection data-test="vulnerabilities-tab">
      <VulnerabilitiesTable data={groupedData} />
    </PageSection>
  );
};
