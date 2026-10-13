import { useMemo } from 'react';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  buildLoginCommand,
  CliAuthMode,
  resolveCliAuthMode,
  resolveCliLogin,
} from './cli-login-utils';

export type CliLoginInfo = {
  /** The cluster's API server URL. */
  apiServerUrl: string;
  /** The OpenShift OAuth token request page (OpenShift only). */
  oauthTokenRequestUrl?: string;
  /** Active workspace from NamespaceProvider, if any. */
  namespace: string;
  /** Ready-to-copy CLI command for the cluster, with `-n` only when in a tenant. */
  loginCommand: string;
  /** OpenShift uses `oc login --web`; Kubernetes/Kind uses kubectl context. */
  authMode: CliAuthMode;
};

/**
 * Resolves the information needed to show a "Copy login command" for the
 * cluster backing the active Konflux workspace.
 *
 * Resolution order:
 *  1. Explicit `cliLogin` in `konflux-public-info` ConfigMap
 *  2. Derive from the page hostname (`*.apps.<clusterDomain>` → OpenShift)
 *
 * Tenant comes from `useNamespace()`.
 *
 * Auth mode:
 *  - OpenShift: `oc login <api> --web`
 *  - Kubernetes: kubectl context / namespace
 *
 * @returns [cliLogin: CliLoginInfo | null, loaded: boolean, error: unknown]
 */
export const useCliLogin = (): [CliLoginInfo | null, boolean, unknown] => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();
  const namespace = useNamespace() ?? '';
  const hostname = window.location.hostname;

  const cliLogin = useMemo<CliLoginInfo | null>(() => {
    if (!loaded) {
      return null;
    }

    const resolved = resolveCliLogin(publicInfo?.cliLogin, hostname);

    if (!resolved) {
      return null;
    }

    const authMode = resolveCliAuthMode(resolved, Boolean(publicInfo?.openshiftVersion));

    return {
      apiServerUrl: resolved.apiServerUrl,
      oauthTokenRequestUrl: resolved.oauthTokenRequestUrl,
      namespace,
      authMode,
      loginCommand: buildLoginCommand(
        authMode,
        resolved.apiServerUrl,
        namespace,
        resolved.kubeContext,
      ),
    };
  }, [loaded, publicInfo, namespace, hostname]);

  return [cliLogin, loaded, cliLogin ? null : error];
};
