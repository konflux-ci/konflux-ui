import * as React from 'react';
import { EmptyStateBody, Text, TextVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Pipeline.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';

const MonitoredReleaseEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No releases found">
    <EmptyStateBody>
      <Text component={TextVariants.p}>
        You don&apos;t have available releases matching the current filters. Please try adjusting
        the filter conditions, or you may not have any releases in the selected namespaces, or your
        old releases were archived.
      </Text>
    </EmptyStateBody>
  </AppEmptyState>
);

export default MonitoredReleaseEmptyState;
