import * as React from 'react';
import { Content, ContentVariants, EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Release.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';

const SelectNamespaceEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Select a namespace to view releases">
    <EmptyStateBody>
      <Content component={ContentVariants.p}>
        Select one or more namespaces from the namespace filter above to view releases.
      </Content>
    </EmptyStateBody>
  </AppEmptyState>
);

export default SelectNamespaceEmptyState;
