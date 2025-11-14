import * as React from 'react';
import ExternalLink from '../../../../shared/components/links/ExternalLink';

const ComponentRegistryLogin: React.FC = () => {
  // Extract the base domain from current window location
  const getRegistryLoginUrl = () => {
    const currentHost = window.location.hostname;
    // Replace konflux-ui with oauth-openshift
    const baseDomain = currentHost.replace('konflux-ui.', '');
    return `https://oauth-openshift.${baseDomain}/oauth/token/display`;
  };

  return (
    <ExternalLink href={getRegistryLoginUrl()} data-test="copy-login-cmd-link">
      Copy Login cmd
    </ExternalLink>
  );
};

export default ComponentRegistryLogin;
