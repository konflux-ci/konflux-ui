import { renderHook } from '@testing-library/react';
import { KonfluxPublicInfo } from '~/types/konflux-public-info';
import { mockUseKonfluxPublicInfo, mockUseNamespaceHook } from '~/unit-test-utils';
import { useCliLogin } from '../useCliLogin';

const emptyPublicInfo: KonfluxPublicInfo = { rbac: [] };

const setHostname = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, hostname },
    writable: true,
    configurable: true,
  });
};

describe('useCliLogin', () => {
  const originalLocation = window.location;
  const useKonfluxPublicInfoMock = mockUseKonfluxPublicInfo();
  const useNamespaceMock = mockUseNamespaceHook('my-tenant');

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('my-tenant');
  });

  it('prefers explicit cliLogin config from konflux-public-info when present', () => {
    setHostname('konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        cliLogin: {
          apiServerUrl: 'https://api.custom.example.com:6443',
          oauthTokenRequestUrl: 'https://oauth.custom.example.com/oauth/token/request',
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin, loaded, error] = result.current;

    expect(cliLogin).toEqual({
      apiServerUrl: 'https://api.custom.example.com:6443',
      oauthTokenRequestUrl: 'https://oauth.custom.example.com/oauth/token/request',
      namespace: 'my-tenant',
      authMode: 'openshift',
      loginCommand: 'oc login https://api.custom.example.com:6443 --web -n my-tenant',
    });
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });

  it('uses kubernetes mode when ConfigMap sets authMode and kubeContext', () => {
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        kubernetesVersion: 'v1.32.0',
        cliLogin: {
          apiServerUrl: 'https://127.0.0.1:37689',
          authMode: 'kubernetes',
          kubeContext: 'kind-konflux',
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin] = result.current;

    expect(cliLogin).toEqual({
      apiServerUrl: 'https://127.0.0.1:37689',
      oauthTokenRequestUrl: undefined,
      namespace: 'my-tenant',
      authMode: 'kubernetes',
      loginCommand:
        'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=my-tenant',
    });
  });

  it('connects to the cluster only when there is no active namespace', () => {
    useNamespaceMock.mockReturnValue('');
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        kubernetesVersion: 'v1.32.0',
        cliLogin: {
          apiServerUrl: 'https://127.0.0.1:37689',
          authMode: 'kubernetes',
          kubeContext: 'kind-konflux',
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin] = result.current;

    expect(cliLogin).toEqual({
      apiServerUrl: 'https://127.0.0.1:37689',
      oauthTokenRequestUrl: undefined,
      namespace: '',
      authMode: 'kubernetes',
      loginCommand: 'kubectl config use-context kind-konflux',
    });
  });

  it('omits -n from oc login when there is no active namespace', () => {
    useNamespaceMock.mockReturnValue('');
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        openshiftVersion: '4.16',
        cliLogin: { apiServerUrl: 'https://api.example.com:6443' },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]?.namespace).toBe('');
    expect(result.current[0]?.loginCommand).toBe('oc login https://api.example.com:6443 --web');
  });

  it('infers OpenShift from openshiftVersion when authMode is unset', () => {
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        openshiftVersion: '4.16',
        cliLogin: { apiServerUrl: 'https://api.example.com:6443' },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]?.authMode).toBe('openshift');
    expect(result.current[0]?.loginCommand).toBe(
      'oc login https://api.example.com:6443 --web -n my-tenant',
    );
  });

  it('falls back to deriving URLs from the UI hostname when no config is present', () => {
    setHostname('konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com');
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, null]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin] = result.current;

    expect(cliLogin).toEqual({
      apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
      oauthTokenRequestUrl:
        'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request',
      namespace: 'my-tenant',
      authMode: 'openshift',
      loginCommand:
        'oc login https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443 --web -n my-tenant',
    });
  });

  it('returns null on localhost when the ConfigMap has no cliLogin', () => {
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, null]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]).toBeNull();
  });

  it('returns null when ConfigMap apiServerUrl is unsafe and the hostname cannot be derived', () => {
    setHostname('localhost');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        cliLogin: { apiServerUrl: 'https://api.example.com:6443; rm -rf /' },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]).toBeNull();
  });

  it('derives from the hostname when ConfigMap apiServerUrl is unsafe', () => {
    setHostname('konflux-ui.apps.example.com');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        cliLogin: { apiServerUrl: 'https://api.example.com:6443; rm -rf /' },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]?.apiServerUrl).toBe('https://api.example.com:6443');
    expect(result.current[0]?.loginCommand).toBe(
      'oc login https://api.example.com:6443 --web -n my-tenant',
    );
  });

  it('does not return ConfigMap or hostname-derived data until public info has loaded', () => {
    setHostname('konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com');
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        rbac: [],
        cliLogin: { apiServerUrl: 'https://api.example.com:6443' },
      },
      false,
      null,
    ]);

    const { result } = renderHook(() => useCliLogin());
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBe(false);
  });

  it('returns null and the fetch error on localhost when public info failed to load', () => {
    setHostname('localhost');
    const err = new Error('boom');
    useKonfluxPublicInfoMock.mockReturnValue([emptyPublicInfo, true, err]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin, loaded, error] = result.current;

    expect(cliLogin).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toBe(err);
  });

  it('clears the fetch error when hostname derivation succeeds', () => {
    setHostname('konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com');
    const err = new Error('boom');
    useKonfluxPublicInfoMock.mockReturnValue([emptyPublicInfo, true, err]);

    const { result } = renderHook(() => useCliLogin());
    const [cliLogin, loaded, error] = result.current;

    expect(cliLogin).toEqual({
      apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
      oauthTokenRequestUrl:
        'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request',
      namespace: 'my-tenant',
      authMode: 'openshift',
      loginCommand:
        'oc login https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443 --web -n my-tenant',
    });
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });
});
