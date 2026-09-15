import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

interface DependencyRunsEmptyStateProps {
  isSingleComponent: boolean;
}

export const DependencyRunsEmptyState = ({ isSingleComponent }: DependencyRunsEmptyStateProps) => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No dependency update runs yet">
      <EmptyStateBody>
        Dependency updates are managed automatically by MintMaker. When a scan detects outdated
        dependencies in this {isSingleComponent ? 'component' : "application's components"}, a
        pipeline run will appear here.
      </EmptyStateBody>
    </AppEmptyState>
  );
};
