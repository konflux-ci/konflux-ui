import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

export const ComponentsListEmptyState: React.FC = () => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Create components in this namespace">
      <EmptyStateBody>
        This namespace has no components. A component is an image built from source code in a
        repository.
      </EmptyStateBody>
    </AppEmptyState>
  );
};
