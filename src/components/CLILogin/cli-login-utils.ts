import { CliLogin } from '~/types/konflux-public-info';

/**
 * OpenShift route marker. UI routes are typically `<name>.apps.<clusterDomain>`;
 * the API server and OAuth endpoint share that same `<clusterDomain>`.
 */
export const APPS_HOSTNAME_MARKER = '.apps.';

/** How the user authenticates the CLI to the cluster. */
export type CliAuthMode = 'openshift' | 'kubernetes';

/** Characters that must not appear in values interpolated into a shell command. */
const SHELL_UNSAFE = /[\s`$&|;<>(){}[\]\\!#*?~'"^]/;

/**
 * Same as `SHELL_UNSAFE` but allows `[]`, which HTTPS IPv6 origins require
 * (`https://[::1]:37689`). Remaining brackets are checked separately.
 */
const SHELL_UNSAFE_EXCEPT_BRACKETS = /[\s`$&|;<>(){}\\!#*?~'"^]/;

/** `https://[::1]:37689` — brackets are IPv6 host delimiters, not a glob. */
const IPV6_HTTPS_ORIGIN = /^https:\/\/\[[0-9a-fA-F:.]+\](?::\d+)?$/;

/** `https://api.example.com:6443` or `https://127.0.0.1:37689`. */
const DNS_OR_IPV4_HTTPS_ORIGIN = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/;

/** Conservative kube-context names: alphanumerics plus `_`, `.`, and `-`. */
const KUBE_CONTEXT_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

const hasShellUnsafeChars = (value: string): boolean => SHELL_UNSAFE.test(value);

const isIpv6Hostname = (hostname: string): boolean =>
  /^\[[0-9a-fA-F:.]+\]$/.test(hostname) ||
  (/^[0-9a-fA-F:.]+$/.test(hostname) && hostname.includes(':'));

const isHttpsOrigin = (url: URL): boolean =>
  url.protocol === 'https:' &&
  !url.username &&
  !url.password &&
  (!url.pathname || url.pathname === '/') &&
  !url.search &&
  !url.hash &&
  Boolean(url.hostname);

/**
 * Parsed HTTPS origin, with IPv6 brackets allowed. Extra path/query/fragment on
 * the input is dropped so the interpolated command uses the origin only.
 */
const canonicalHttpsOrigin = (value: string): string | null => {
  if (!value || SHELL_UNSAFE_EXCEPT_BRACKETS.test(value)) {
    return null;
  }
  try {
    const url = new URL(value);
    if (!isHttpsOrigin(url)) {
      return null;
    }
    const origin = url.origin;
    if (/[[\]]/.test(value) && !isIpv6Hostname(url.hostname)) {
      return null;
    }
    if (!IPV6_HTTPS_ORIGIN.test(origin) && !DNS_OR_IPV4_HTTPS_ORIGIN.test(origin)) {
      return null;
    }
    return origin;
  } catch {
    return null;
  }
};

/**
 * True when `value` is an HTTPS origin with no credentials, path, query, fragment,
 * or shell-control characters. Used for ConfigMap `apiServerUrl` before it is
 * interpolated into a generated CLI command. IPv6 hosts (`[::1]`) are allowed.
 */
export const isSafeApiServerUrl = (value: string): boolean => canonicalHttpsOrigin(value) !== null;

/**
 * True when `value` is an HTTPS URL with no credentials, query, fragment, or
 * shell-control characters. Paths are allowed so OpenShift OAuth token-request
 * URLs such as `/oauth/token/request` remain valid. IPv6 hosts are allowed.
 */
export const isSafeOauthTokenRequestUrl = (value: string): boolean => {
  if (!value || SHELL_UNSAFE_EXCEPT_BRACKETS.test(value)) {
    return false;
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !url.hostname
    ) {
      return false;
    }
    if (/[[\]]/.test(value) && !isIpv6Hostname(url.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const isSafeKubeContext = (value: string | undefined): value is string =>
  !!value && KUBE_CONTEXT_NAME.test(value);

const sanitizeExplicitCliLogin = (explicit: CliLogin): CliLogin | null => {
  const apiServerUrl = canonicalHttpsOrigin(explicit.apiServerUrl);
  if (!apiServerUrl) {
    return null;
  }

  const oauthTokenRequestUrl =
    explicit.oauthTokenRequestUrl && isSafeOauthTokenRequestUrl(explicit.oauthTokenRequestUrl)
      ? explicit.oauthTokenRequestUrl
      : undefined;

  const kubeContext = isSafeKubeContext(explicit.kubeContext) ? explicit.kubeContext : undefined;

  const authMode =
    explicit.authMode === 'openshift' || explicit.authMode === 'kubernetes'
      ? explicit.authMode
      : undefined;

  return {
    apiServerUrl,
    oauthTokenRequestUrl,
    authMode,
    kubeContext,
  };
};

/**
 * Derives the OpenShift API server URL and OAuth token request URL from a hostname
 * that follows the OpenShift apps-route convention (`*.apps.<clusterDomain>`).
 *
 * Example for cluster domain `stone-stg-rh01.l2vh.p1.openshiftapps.com`:
 *  - UI:    konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com
 *  - API:   api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443
 *  - OAuth: oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request
 *
 * Returns `null` for hostnames that do not
 * match (localhost, custom domains without `.apps.`, etc.).
 */
export const deriveCliLoginFromHostname = (hostname: string): CliLogin | null => {
  const markerIndex = hostname.indexOf(APPS_HOSTNAME_MARKER);
  if (markerIndex === -1) {
    return null;
  }

  const clusterDomain = hostname.slice(markerIndex + APPS_HOSTNAME_MARKER.length);
  if (!clusterDomain || hasShellUnsafeChars(clusterDomain)) {
    return null;
  }

  const derived: CliLogin = {
    apiServerUrl: `https://api.${clusterDomain}:6443`,
    oauthTokenRequestUrl: `https://oauth-openshift.apps.${clusterDomain}/oauth/token/request`,
    authMode: 'openshift',
  };

  if (
    !isSafeApiServerUrl(derived.apiServerUrl) ||
    !derived.oauthTokenRequestUrl ||
    !isSafeOauthTokenRequestUrl(derived.oauthTokenRequestUrl)
  ) {
    return null;
  }

  return derived;
};

/**
 * Resolves CLI login URLs in priority order:
 *  1. Explicit config from the `konflux-public-info` ConfigMap (`cliLogin`)
 *  2. Derivation from the page hostname (`*.apps.<clusterDomain>`)
 *
 * Invalid explicit URLs are rejected rather than interpolated into a command.
 * When sanitization fails, hostname derivation is still attempted so a typo in
 * the ConfigMap does not hide a working OpenShift `*.apps.*` fallback.
 */
export const resolveCliLogin = (
  explicit: CliLogin | null | undefined,
  pageHostname: string,
): CliLogin | null => {
  if (explicit?.apiServerUrl) {
    const sanitized = sanitizeExplicitCliLogin(explicit);
    if (sanitized) {
      return sanitized;
    }
  }

  return deriveCliLoginFromHostname(pageHostname);
};

/**
 * OpenShift clusters use `oc login --web`.
 * Local Kind / plain Kubernetes clusters use kubectl context.
 */
export const resolveCliAuthMode = (
  cliLogin: CliLogin,
  hasOpenShiftVersion: boolean,
): CliAuthMode => {
  if (cliLogin.authMode === 'openshift' || cliLogin.authMode === 'kubernetes') {
    return cliLogin.authMode;
  }
  if (hasOpenShiftVersion) {
    return 'openshift';
  }
  if (cliLogin.oauthTokenRequestUrl) {
    return 'openshift';
  }
  return 'kubernetes';
};

/** Fallback when neither namespace nor kube context can be used. */
export const KUBECTL_LIST_CONTEXTS_COMMAND = 'kubectl config get-contexts';

/** Builds the `oc login` command for OpenShift clusters. */
export const buildOcLoginCommand = (apiServerUrl: string, namespace?: string): string => {
  const origin = canonicalHttpsOrigin(apiServerUrl);
  const namespaceFlag = namespace ? ` -n ${namespace}` : '';
  if (!origin) {
    return `oc login --web${namespaceFlag}`;
  }
  // Quote IPv6 origins so bash does not treat `[::1]` as a glob.
  const server = origin.includes('[') ? `'${origin}'` : origin;
  return `oc login ${server} --web${namespaceFlag}`;
};

/**
 * Builds a kubectl command for Kind / plain Kubernetes clusters.
 */
export const buildKubernetesLoginCommand = (namespace?: string, context?: string): string => {
  const steps: string[] = [];
  if (isSafeKubeContext(context)) {
    steps.push(`kubectl config use-context ${context}`);
  }
  if (namespace) {
    steps.push(`kubectl config set-context --current --namespace=${namespace}`);
  }
  return steps.length > 0 ? steps.join(' && ') : KUBECTL_LIST_CONTEXTS_COMMAND;
};

export const buildLoginCommand = (
  mode: CliAuthMode,
  apiServerUrl: string,
  namespace?: string,
  kubeContext?: string,
): string => {
  if (mode === 'kubernetes') {
    return buildKubernetesLoginCommand(namespace, kubeContext);
  }
  return buildOcLoginCommand(apiServerUrl, namespace);
};
