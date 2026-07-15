import * as React from 'react';
import { EmptyStateBody, Content, ContentVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Release.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import ExternalLink from '../../shared/components/links/ExternalLink';

const MonitoredReleaseEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No releases found">
    <EmptyStateBody>
      <Content component={ContentVariants.p}>You don&apos;t have available releases now.</Content>
      <ExternalLink href="https://konflux-ci.dev/docs/releasing/">
        Learn more about setting up release services
      </ExternalLink>
    </EmptyStateBody>
  </AppEmptyState>
);

export default MonitoredReleaseEmptyState;
