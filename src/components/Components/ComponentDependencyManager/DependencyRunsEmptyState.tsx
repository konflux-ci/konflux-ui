import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

export const DependencyRunsEmptyState = () => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No dependency update runs yet">
      <EmptyStateBody>
        Dependency updates are managed automatically by MintMaker. When a scan detects outdated
        dependencies in this component, a pipeline run will appear here.
      </EmptyStateBody>
    </AppEmptyState>
  );
};
