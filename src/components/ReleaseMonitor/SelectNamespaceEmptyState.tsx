import * as React from 'react';
import { EmptyStateBody, Text, TextVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Release.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';

const SelectNamespaceEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Select a namespace to view releases">
    <EmptyStateBody>
      <Text component={TextVariants.p}>
        Select one or more namespaces from the namespace filter above to view releases.
      </Text>
    </EmptyStateBody>
  </AppEmptyState>
);

export default SelectNamespaceEmptyState;
