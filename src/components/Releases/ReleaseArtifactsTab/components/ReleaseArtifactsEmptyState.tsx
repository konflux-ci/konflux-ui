import React from 'react';
import { EmptyStateBody, Content, ContentVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '../../../../assets/Release.svg';
import AppEmptyState from '../../../../shared/components/empty-state/AppEmptyState';

export const ReleaseArtifactsEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No release artifacts images">
    <EmptyStateBody>
      <Content component={ContentVariants.p}>No release artifacts images found</Content>
    </EmptyStateBody>
  </AppEmptyState>
);
