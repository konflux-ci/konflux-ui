import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import type { RoxctlCveTableRow } from './types';

type VulnerabilitiesTableProps = {
  data: RoxctlCveTableRow[];
};

/**
 * Placeholder until KFLUXSE-513 implements the full CVE table with filters and sorting.
 */
export const VulnerabilitiesTable: React.FC<VulnerabilitiesTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <EmptyState
        data-test="vulnerabilities-no-data"
        headingLevel="h4"
        icon={SearchIcon}
        titleText="No fixable vulnerabilities found"
        variant={EmptyStateVariant.full}
      >
        <EmptyStateBody>
          This scan did not find any fixable vulnerabilities.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return <div data-test="vulnerabilities-table" />;
};
