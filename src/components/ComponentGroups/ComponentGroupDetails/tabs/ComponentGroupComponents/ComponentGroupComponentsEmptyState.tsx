import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

export const ComponentGroupComponentsEmptyState: React.FC = () => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Add components to this group">
      <EmptyStateBody>
        This group has no components. A component is an image built from source code in a
        repository.
      </EmptyStateBody>
    </AppEmptyState>
  );
};
