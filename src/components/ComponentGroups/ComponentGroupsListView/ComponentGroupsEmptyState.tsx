import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

const ComponentGroupsEmptyState = () => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Organize components for testing">
      <EmptyStateBody>
        A component group bundles components and branches for snapshot creation and integration
        testing. Create a group to coordinate how your components are tested and released together.
      </EmptyStateBody>
    </AppEmptyState>
  );
};

export default ComponentGroupsEmptyState;
