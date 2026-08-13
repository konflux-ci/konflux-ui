import { CliLogin } from '~/types/konflux-public-info';
import {
  buildKubernetesLoginCommand,
  buildLoginCommand,
  buildOcLoginCommand,
  deriveCliLoginFromHostname,
  isSafeApiServerUrl,
  isSafeOauthTokenRequestUrl,
  resolveCliAuthMode,
  resolveCliLogin,
} from '../cli-login-utils';

describe('deriveCliLoginFromHostname', () => {
  it('derives the API server and OAuth token request URLs for a hostname', () => {
    const result = deriveCliLoginFromHostname(
      'konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com',
    );

    expect(result).toEqual({
      apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
      oauthTokenRequestUrl:
        'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request',
      authMode: 'openshift',
    });
  });

  it('derives URLs for any OpenShift *.apps.<clusterDomain> UI route', () => {
    const result = deriveCliLoginFromHostname('konflux.apps.my-cluster.example.com');

    expect(result).toEqual({
      apiServerUrl: 'https://api.my-cluster.example.com:6443',
      oauthTokenRequestUrl:
        'https://oauth-openshift.apps.my-cluster.example.com/oauth/token/request',
      authMode: 'openshift',
    });
  });

  it('returns null when the hostname does not contain .apps.', () => {
    expect(deriveCliLoginFromHostname('localhost')).toBeNull();
    expect(deriveCliLoginFromHostname('127.0.0.1')).toBeNull();
    expect(deriveCliLoginFromHostname('my-custom-domain.example.com')).toBeNull();
  });

  it('returns null when there is nothing after .apps.', () => {
    expect(deriveCliLoginFromHostname('konflux-ui.apps.')).toBeNull();
  });

  it('returns null when the derived API URL would not be a safe HTTPS origin', () => {
    expect(deriveCliLoginFromHostname('konflux-ui.apps.foo@bar.example.com')).toBeNull();
  });

  it('returns null when the cluster domain contains shell metacharacters', () => {
    expect(deriveCliLoginFromHostname('konflux-ui.apps.foo;bar.example.com')).toBeNull();
  });
});

describe('isSafeApiServerUrl', () => {
  it('accepts an HTTPS origin with a port', () => {
    expect(isSafeApiServerUrl('https://api.example.com:6443')).toBe(true);
    expect(isSafeApiServerUrl('https://127.0.0.1:37689')).toBe(true);
    expect(isSafeApiServerUrl('https://[::1]:37689')).toBe(true);
    expect(isSafeApiServerUrl('https://api.example.com')).toBe(true);
  });

  it('rejects HTTP, credentials, paths, queries, fragments, and shell metacharacters', () => {
    expect(isSafeApiServerUrl('http://api.example.com:6443')).toBe(false);
    expect(isSafeApiServerUrl('https://user:pass@api.example.com:6443')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443/k8s')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443?x=1')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443#frag')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443; rm -rf /')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443$(reboot)')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443^id')).toBe(false);
    expect(isSafeApiServerUrl('https://api.example.com:6443[id]')).toBe(false);
    expect(isSafeApiServerUrl('not-a-url')).toBe(false);
    expect(isSafeApiServerUrl('')).toBe(false);
  });
});

describe('isSafeOauthTokenRequestUrl', () => {
  it('accepts an HTTPS URL with an OAuth path', () => {
    expect(
      isSafeOauthTokenRequestUrl('https://oauth-openshift.apps.example.com/oauth/token/request'),
    ).toBe(true);
  });

  it('rejects HTTP, credentials, queries, fragments, and shell metacharacters', () => {
    expect(isSafeOauthTokenRequestUrl('http://oauth.example.com/oauth/token/request')).toBe(false);
    expect(
      isSafeOauthTokenRequestUrl('https://user:pass@oauth.example.com/oauth/token/request'),
    ).toBe(false);
    expect(
      isSafeOauthTokenRequestUrl('https://oauth.example.com/oauth/token/request?next=evil'),
    ).toBe(false);
    expect(isSafeOauthTokenRequestUrl('https://oauth.example.com/oauth/token/request#x')).toBe(
      false,
    );
    expect(isSafeOauthTokenRequestUrl('https://oauth.example.com/oauth/token/request`id`')).toBe(
      false,
    );
    expect(isSafeOauthTokenRequestUrl('https://oauth.example.com/oauth/token/request^id')).toBe(
      false,
    );
    expect(isSafeOauthTokenRequestUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeOauthTokenRequestUrl('not-a-url')).toBe(false);
  });
});

describe('resolveCliLogin', () => {
  const explicit = {
    apiServerUrl: 'https://api.custom.example.com:6443',
    oauthTokenRequestUrl: 'https://oauth.custom.example.com/oauth/token/request',
  };

  it('prefers explicit config over hostname derivation', () => {
    expect(
      resolveCliLogin(explicit, 'konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com'),
    ).toEqual(explicit);
  });

  it('allows Kubernetes-only config with apiServerUrl and no OAuth URL', () => {
    expect(resolveCliLogin({ apiServerUrl: 'https://127.0.0.1:37689' }, 'localhost')).toEqual({
      apiServerUrl: 'https://127.0.0.1:37689',
      oauthTokenRequestUrl: undefined,
      authMode: undefined,
      kubeContext: undefined,
    });
  });

  it('derives from the page hostname when no explicit config is present', () => {
    expect(
      resolveCliLogin(undefined, 'konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com'),
    ).toEqual({
      apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
      oauthTokenRequestUrl:
        'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request',
      authMode: 'openshift',
    });
  });

  it('does not derive OpenShift URLs from localhost', () => {
    expect(resolveCliLogin(undefined, 'localhost')).toBeNull();
  });

  it('drops an invalid authMode instead of passing it through', () => {
    expect(
      resolveCliLogin(
        {
          apiServerUrl: 'https://127.0.0.1:37689',
          authMode: 'not-a-mode',
        } as unknown as CliLogin,
        'localhost',
      ),
    ).toEqual({
      apiServerUrl: 'https://127.0.0.1:37689',
      oauthTokenRequestUrl: undefined,
      authMode: undefined,
      kubeContext: undefined,
    });
  });

  it('falls back to hostname derivation when the ConfigMap apiServerUrl is unsafe', () => {
    expect(
      resolveCliLogin(
        { apiServerUrl: 'https://api.example.com:6443; curl evil.example' },
        'konflux-ui.apps.example.com',
      ),
    ).toEqual({
      apiServerUrl: 'https://api.example.com:6443',
      oauthTokenRequestUrl: 'https://oauth-openshift.apps.example.com/oauth/token/request',
      authMode: 'openshift',
    });
  });

  it('rejects a hostile apiServerUrl on localhost instead of interpolating it', () => {
    expect(
      resolveCliLogin(
        { apiServerUrl: 'https://api.example.com:6443; curl evil.example' },
        'localhost',
      ),
    ).toBeNull();
  });

  it('drops a hostile oauthTokenRequestUrl but keeps a valid apiServerUrl', () => {
    expect(
      resolveCliLogin(
        {
          apiServerUrl: 'https://api.example.com:6443',
          oauthTokenRequestUrl: 'https://oauth.example.com/oauth/token/request?next=https://evil',
        },
        'localhost',
      ),
    ).toEqual({
      apiServerUrl: 'https://api.example.com:6443',
      oauthTokenRequestUrl: undefined,
      authMode: undefined,
      kubeContext: undefined,
    });
  });

  it('drops a hostile kubeContext', () => {
    expect(
      resolveCliLogin(
        {
          apiServerUrl: 'https://127.0.0.1:37689',
          authMode: 'kubernetes',
          kubeContext: 'kind-konflux; rm -rf /',
        },
        'localhost',
      ),
    ).toEqual({
      apiServerUrl: 'https://127.0.0.1:37689',
      oauthTokenRequestUrl: undefined,
      authMode: 'kubernetes',
      kubeContext: undefined,
    });
  });
});

describe('resolveCliAuthMode', () => {
  it('uses an explicit authMode when provided', () => {
    expect(
      resolveCliAuthMode({ apiServerUrl: 'https://api.example.com', authMode: 'kubernetes' }, true),
    ).toBe('kubernetes');
    expect(
      resolveCliAuthMode({ apiServerUrl: 'https://api.example.com', authMode: 'openshift' }, false),
    ).toBe('openshift');
  });

  it('treats openshiftVersion as OpenShift', () => {
    expect(resolveCliAuthMode({ apiServerUrl: 'https://api.example.com' }, true)).toBe('openshift');
  });

  it('treats a present OAuth token URL as OpenShift when authMode is unset', () => {
    expect(
      resolveCliAuthMode(
        {
          apiServerUrl: 'https://api.example.com',
          oauthTokenRequestUrl: 'https://oauth-openshift.apps.example.com/oauth/token/request',
        },
        false,
      ),
    ).toBe('openshift');
    expect(
      resolveCliAuthMode(
        {
          apiServerUrl: 'https://api.example.com',
          oauthTokenRequestUrl: 'https://oauth.custom.example.com/oauth/token/request',
        },
        false,
      ),
    ).toBe('openshift');
  });

  it('defaults to kubernetes when only an API URL is present', () => {
    expect(resolveCliAuthMode({ apiServerUrl: 'https://127.0.0.1:37689' }, false)).toBe(
      'kubernetes',
    );
  });
});

describe('buildOcLoginCommand', () => {
  it('includes the namespace flag when a namespace is provided', () => {
    expect(buildOcLoginCommand('https://api.example.com:6443', 'my-tenant')).toBe(
      'oc login https://api.example.com:6443 --web -n my-tenant',
    );
  });

  it('omits the namespace flag when no namespace is provided', () => {
    expect(buildOcLoginCommand('https://api.example.com:6443')).toBe(
      'oc login https://api.example.com:6443 --web',
    );
  });

  it('omits the namespace flag when the namespace is an empty string', () => {
    expect(buildOcLoginCommand('https://api.example.com:6443', '')).toBe(
      'oc login https://api.example.com:6443 --web',
    );
  });

  it('omits an unsafe namespace instead of interpolating it', () => {
    expect(buildOcLoginCommand('https://api.example.com:6443', 'my-tenant; reboot')).toBe(
      'oc login https://api.example.com:6443 --web',
    );
  });

  it('quotes an IPv6 API URL so the shell does not glob the brackets', () => {
    expect(buildOcLoginCommand('https://[::1]:37689', 'my-tenant')).toBe(
      "oc login 'https://[::1]:37689' --web -n my-tenant",
    );
  });

  it('omits an unsafe API URL instead of interpolating it', () => {
    expect(buildOcLoginCommand('https://api.example.com:6443; rm -rf /', 'my-tenant')).toBe(
      'oc login --web -n my-tenant',
    );
  });

  it('includes a 63-character namespace and omits a longer one', () => {
    const maxLength = 'a'.repeat(63);
    const tooLong = `n${'a'.repeat(63)}`;
    expect(buildOcLoginCommand('https://api.example.com:6443', maxLength)).toBe(
      `oc login https://api.example.com:6443 --web -n ${maxLength}`,
    );
    expect(buildOcLoginCommand('https://api.example.com:6443', tooLong)).toBe(
      'oc login https://api.example.com:6443 --web',
    );
  });
});

describe('buildKubernetesLoginCommand', () => {
  it('sets context and namespace for Kind', () => {
    expect(buildKubernetesLoginCommand('my-tenant', 'kind-konflux')).toBe(
      'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=my-tenant',
    );
  });

  it('sets only the namespace when no context is provided', () => {
    expect(buildKubernetesLoginCommand('my-tenant')).toBe(
      'kubectl config set-context --current --namespace=my-tenant',
    );
  });

  it('sets only the context when no namespace is provided', () => {
    expect(buildKubernetesLoginCommand(undefined, 'kind-konflux')).toBe(
      'kubectl config use-context kind-konflux',
    );
  });

  it('falls back to listing contexts when neither context nor namespace is provided', () => {
    expect(buildKubernetesLoginCommand()).toBe('kubectl config get-contexts');
    expect(buildKubernetesLoginCommand('')).toBe('kubectl config get-contexts');
  });

  it('omits unsafe context and namespace values', () => {
    expect(buildKubernetesLoginCommand('ns;id', 'ctx$(id)')).toBe('kubectl config get-contexts');
  });
});

describe('buildLoginCommand', () => {
  it('builds an oc login --web command for OpenShift', () => {
    expect(buildLoginCommand('openshift', 'https://api.example.com:6443', 'ns')).toBe(
      'oc login https://api.example.com:6443 --web -n ns',
    );
  });

  it('builds a kubectl context command for Kubernetes', () => {
    expect(buildLoginCommand('kubernetes', 'https://127.0.0.1:37689', 'ns', 'kind-konflux')).toBe(
      'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=ns',
    );
  });
});
