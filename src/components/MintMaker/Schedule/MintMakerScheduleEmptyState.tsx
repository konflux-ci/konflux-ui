import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

export const MintMakerScheduleEmptyState = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No upcoming runs scheduled">
    <EmptyStateBody>
      MintMaker has not scheduled any upcoming dependency update runs for this cluster.
    </EmptyStateBody>
  </AppEmptyState>
);
