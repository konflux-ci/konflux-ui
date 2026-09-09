import * as React from 'react';
import {
  Alert,
  ClipboardCopy,
  Content,
  ContentVariants,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { CliAuthMode, KUBECTL_LIST_CONTEXTS_COMMAND } from './cli-login-utils';
import type { CliLoginInfo } from './useCliLogin';

import './CliLoginContent.scss';

const getLoginCommandHeading = (authMode: CliAuthMode, loginCommand: string): string => {
  if (authMode !== 'kubernetes') {
    return 'Copy login command to log in with oc:';
  }
  const rest =
    loginCommand === KUBECTL_LIST_CONTEXTS_COMMAND
      ? 'list the available kubectl contexts for this cluster:'
      : 'configure kubectl for this cluster:';
  return `Copy login command to ${rest}`;
};

type CliLoginContentProps = {
  cliLogin: CliLoginInfo | null;
  loaded: boolean;
  error: unknown;
};

export const CliLoginContent: React.FC<CliLoginContentProps> = ({ cliLogin, loaded, error }) => {
  if (!loaded) {
    return <Skeleton aria-label="Loading CLI login details" data-test="cli-login-skeleton" />;
  }

  if (error && !cliLogin) {
    return (
      <Alert
        variant="danger"
        isInline
        isPlain
        title="Unable to load CLI login details"
        data-test="cli-login-error"
      >
        Cluster information could not be retrieved. Try again later.
      </Alert>
    );
  }

  if (!cliLogin) {
    return (
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
    );
  }

  return (
    <Stack hasGutter className="cli-login-content__command">
      <StackItem>
        <Content component={ContentVariants.h2}>
          {getLoginCommandHeading(cliLogin.authMode, cliLogin.loginCommand)}
        </Content>
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
    </Stack>
  );
};
