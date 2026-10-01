import * as React from 'react';
import {
  Bullseye,
  PageSection,
  Spinner,
} from '@patternfly/react-core';
import { getErrorState } from '~/shared/utils/error-utils';
import type { TaskRunKind } from '~/types';
import { groupRowsByCve } from './roxctl-utils';
import type { RoxctlCveTableRow } from './types';
import { useRoxctlCveReport } from './useRoxctlCveReport';
import { VulnerabilitiesTable } from './VulnerabilitiesTable';

type VulnerabilitiesTabContentProps = {
  taskRun: TaskRunKind;
};

export const VulnerabilitiesTabContent: React.FC<VulnerabilitiesTabContentProps> = ({
  taskRun,
}) => {
  const { data, isLoading, isPending, error } = useRoxctlCveReport(taskRun);

  const groupedData: RoxctlCveTableRow[] = React.useMemo(
    () => groupRowsByCve(data ?? []),
    [data],
  );

  if (isPending || isLoading) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
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
