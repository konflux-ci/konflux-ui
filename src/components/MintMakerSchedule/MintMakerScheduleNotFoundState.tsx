import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Pipeline.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

export const MintMakerScheduleNotFoundState = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Schedule not available">
    <EmptyStateBody>
      The MintMaker schedule has not been calculated yet. This is a cluster-wide feature managed
      automatically by MintMaker. Check back later once MintMaker has run its first scan.
    </EmptyStateBody>
  </AppEmptyState>
);
