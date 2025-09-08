import React from 'react';
import { EmptyStateBody, Text, TextVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '../../../../assets/Release.svg';
import AppEmptyState from '../../../../shared/components/empty-state/AppEmptyState';

export const ReleaseArtifactsEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No release artifacts images">
    <EmptyStateBody>
      <Text component={TextVariants.p}>No release artifacts images found</Text>
    </EmptyStateBody>
  </AppEmptyState>
);
