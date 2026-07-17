import * as React from 'react';
import { Alert, ClipboardCopy, Skeleton, Content } from '@patternfly/react-core';
import { useImageProxy } from '~/hooks/useImageProxy';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentRegistryLogin: React.FC = () => {
  const [urlInfo, loaded, error] = useImageProxy();
  // Show skeleton while loading
  if (!loaded) {
    return <Skeleton aria-label="Loading proxy image URL" data-test="registry-login-skeleton" />;
  }

  // Handle error state
  if (error) {
    return getErrorState(error, loaded, 'registry login URL', true);
  }

  // Handle domain not configured
  if (!urlInfo) {
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

  const oauthUrl = urlInfo.buildUrl(urlInfo.oauthPath);

  return (
    <>
      <Content className="pf-v6-u-mb-sm">
        <Content component="p">
          <ExternalLink href={oauthUrl}>Get your authentication token</ExternalLink>
          {' and use it as the password when prompted'}
        </Content>
      </Content>
      <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" style={{ width: '60%' }}>
        {`podman login -u unused ${urlInfo.hostname}`}
      </ClipboardCopy>
    </>
  );
};

export default ComponentRegistryLogin;
