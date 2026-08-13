import * as React from 'react';
import {
  Alert,
  Button,
  ClipboardCopy,
  Content,
  ContentVariants,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useCliLogin } from './useCliLogin';

import './CliLoginPage.scss';

const CliLoginPage: React.FC = () => {
  const [cliLogin, loaded, error] = useCliLogin();
  const [tokenVisible, setTokenVisible] = React.useState(false);

  React.useEffect(() => {
    // oauthTokenRequestUrl is HTTPS-only after isSafeOauthTokenRequestUrl (ConfigMap / hostname).
    if (cliLogin?.oauthTokenRequestUrl) {
      window.location.replace(cliLogin.oauthTokenRequestUrl);
    }
  }, [cliLogin?.oauthTokenRequestUrl]);

  if (!loaded) {
    return (
      <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
        <Skeleton aria-label="Loading CLI login details" data-test="cli-login-skeleton" />
      </main>
    );
  }

  if (error && !cliLogin) {
    return (
      <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
        <Alert
          variant="danger"
          isInline
          isPlain
          title="Unable to load CLI login details"
          data-test="cli-login-error"
        >
          Cluster information could not be retrieved. Try again later.
        </Alert>
      </main>
    );
  }

  if (!cliLogin) {
    return (
      <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
        <Alert
          variant="warning"
          isInline
          isPlain
          title="CLI login is not available for this cluster"
          data-test="cli-login-not-configured"
        >
          Ask your cluster administrator to configure it. OpenShift UIs at a <code>*.apps.*</code>{' '}
          hostname derive settings automatically. For Kind or a custom domain, merge{' '}
          <code>cliLogin</code> into the existing <code>info.json</code> of the{' '}
          <code>konflux-public-info</code> ConfigMap. konflux-operator overwrites unknown fields on
          reconcile.
        </Alert>
      </main>
    );
  }

  if (cliLogin.oauthTokenRequestUrl) {
    return (
      <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
        <Skeleton aria-label="Opening cluster login page" data-test="cli-login-oauth-redirect" />
      </main>
    );
  }

  if (!tokenVisible) {
    return (
      <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
        <Button
          variant="primary"
          onClick={() => setTokenVisible(true)}
          data-test="cli-login-display-token"
        >
          Display Token
        </Button>
      </main>
    );
  }

  return (
    <main className="cli-login-page pf-v6-theme-dark" data-test="cli-login-page">
      <Stack hasGutter className="cli-login-page__command">
        <StackItem>
          <Content component={ContentVariants.h2}>Log in with this token</Content>
        </StackItem>
        <StackItem>
          <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" data-test="cli-login-command">
            {cliLogin.loginCommand}
          </ClipboardCopy>
        </StackItem>
        {cliLogin.authMode === 'kubernetes' ? (
          <StackItem>
            <Content component={ContentVariants.small}>
              API server: <code>{cliLogin.apiServerUrl}</code>. Use your existing kubeconfig for this
              cluster.
            </Content>
          </StackItem>
        ) : null}
        <StackItem>
          <Button
            variant="link"
            isInline
            onClick={() => setTokenVisible(false)}
            data-test="cli-login-request-another"
          >
            Request another token
          </Button>
        </StackItem>
      </Stack>
    </main>
  );
};

export default CliLoginPage;
