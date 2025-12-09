import * as React from 'react';
import { Alert, Skeleton } from '@patternfly/react-core';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { getErrorState } from '~/shared/utils/error-utils';
import { useRegistryLoginUrl } from './useRegistryLoginUrl';

const ComponentRegistryLogin: React.FC = () => {
  const [registryLoginUrl, loaded, error] = useRegistryLoginUrl();

  // Show skeleton while loading
  if (!loaded) {
    return <Skeleton aria-label="Loading proxy image URL" data-test="registry-login-skeleton" />;
  }

  // Handle error state
  if (error) {
    return getErrorState(error, loaded, 'registry login URL', true);
  }

  // Handle domain not configured
  if (!registryLoginUrl) {
    return (
      <Alert
        variant="warning"
        isInline
        isPlain
        title="Registry domain not configured"
        data-test="registry-login-not-configured"
      />
    );
  }

  return <ExternalLink href={registryLoginUrl}>Copy Login cmd</ExternalLink>;
};

export default ComponentRegistryLogin;
