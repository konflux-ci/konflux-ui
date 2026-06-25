import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';

export const PipelineRunsEmptyState: React.FC = () => (
  <EmptyState variant={EmptyStateVariant.full} data-test="pipeline-runs-empty-state">
    <EmptyStateHeader
      titleText="No pipeline runs"
      headingLevel="h4"
      icon={<EmptyStateIcon icon={SearchIcon} />}
    />
    <EmptyStateBody>
      Select an application or component from the filters above to view pipeline runs.
    </EmptyStateBody>
  </EmptyState>
);
