import * as React from 'react';
import { Alert, Spinner } from '@patternfly/react-core';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { getErrorState } from '~/shared/utils/error-utils';
import { useRegistryLoginUrl } from './useRegistryLoginUrl';

const ComponentRegistryLogin: React.FC = () => {
  const [registryLoginUrl, loaded, error] = useRegistryLoginUrl();

  // Show spinner while loading
  if (!loaded) {
    return <Spinner size="md" data-test="registry-login-spinner" />;
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
