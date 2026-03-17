import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import gitUrlParse from 'git-url-parse';
import ForgejoLogo from '../shared/assets/forgejo-logo.svg';

type GitProviderConfig = {
  source: string;
  branchPath: string;
  commitPath: string;
  pullRequestPath: string;
  canConstructHostedRepoUrl?: boolean;
  selfHostedKeywords?: string[];
};

const PROVIDERS: GitProviderConfig[] = [
  {
    source: 'github.com',
    branchPath: '/tree',
    commitPath: '/commit',
    pullRequestPath: '/pull',
    canConstructHostedRepoUrl: true,
    selfHostedKeywords: ['github'],
  },
  {
    source: 'bitbucket.org',
    branchPath: '/branch',
    commitPath: '/commits',
    pullRequestPath: '/pull-requests',
    canConstructHostedRepoUrl: false,
    selfHostedKeywords: ['bitbucket'],
  },
  {
    source: 'gitlab.com',
    branchPath: '/-/tree',
    commitPath: '/-/commit',
    pullRequestPath: '/-/merge_requests',
    canConstructHostedRepoUrl: false,
    selfHostedKeywords: ['gitlab'],
  },
  {
    source: 'forgejo.org',
    branchPath: '/src/branch',
    commitPath: '/commit',
    pullRequestPath: '/pulls',
    canConstructHostedRepoUrl: false,
    selfHostedKeywords: ['forgejo', 'gitea'],
  },
  {
    source: 'codeberg.org',
    branchPath: '/src/branch',
    commitPath: '/commit',
    pullRequestPath: '/pulls',
    canConstructHostedRepoUrl: false,
    selfHostedKeywords: ['codeberg'],
  },
];

type GitPathType = 'branchPath' | 'commitPath' | 'pullRequestPath';

export const findProvider = (hostOrUrl: string): string | undefined => {
  const host = hostOrUrl.includes('://')
    ? (gitUrlParse(hostOrUrl) as gitUrlParse.GitUrl).resource
    : hostOrUrl;
  const segments = host.split('.');

  return PROVIDERS.find(
    (p) => p.source === host || p.selfHostedKeywords?.some((kw) => segments.includes(kw)),
  )?.source;
};

const getProviderConfig = (hostOrUrl: string): GitProviderConfig | undefined => {
  const provider = findProvider(hostOrUrl);
  return provider ? PROVIDERS.find((p) => p.source === provider) : undefined;
};

const getProviderConfigBySourceOrHost = (value: string): GitProviderConfig | undefined =>
  PROVIDERS.find((p) => p.source === value) ?? getProviderConfig(value);

const getProviderPath = (hostOrUrl: string, pathType: GitPathType): string | null =>
  getProviderConfig(hostOrUrl)?.[pathType] ?? null;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const buildProviderRepoURL = (
  repoURL: string,
  identifier: string,
  pathType: GitPathType,
  hostOrUrl?: string,
): string | null => {
  if (!repoURL || !identifier) {
    return null;
  }

  const pathPrefix =
    getProviderPath(hostOrUrl ?? repoURL, pathType) ?? getProviderPath(repoURL, pathType);
  return pathPrefix
    ? `${trimTrailingSlash(repoURL)}${pathPrefix}/${identifier}`
    : null;
};

const getPathPrefix = (gitSource: string, domain?: string): string | null =>
  getProviderPath(domain ?? gitSource, 'branchPath') ?? getProviderPath(gitSource, 'branchPath');

export const getGitPath = (
  gitSource: string,
  revision: string,
  path?: string,
  domain?: string,
): string => {
  const prefix = getPathPrefix(gitSource, domain);
  return !revision || !prefix ? '' : `${prefix}/${revision}${path ? `/${path}` : ''}`;
};

export const createGitBranchURL = (
  repoURL: string,
  branch: string,
  hostOrUrl?: string,
): string | null => buildProviderRepoURL(repoURL, branch, 'branchPath', hostOrUrl);

export const createGitCommitURL = (
  repoURL: string,
  commitSHA: string,
  hostOrUrl?: string,
): string | null => buildProviderRepoURL(repoURL, commitSHA, 'commitPath', hostOrUrl);

export const createGitPullRequestURL = (
  repoURL: string,
  pullRequestNumber: string,
  hostOrUrl?: string,
): string | null =>
  buildProviderRepoURL(repoURL, pullRequestNumber, 'pullRequestPath', hostOrUrl);

export const createHostedRepoURL = (
  repoOrg: string,
  repoName: string,
  providerOrHost: string,
): string | null => {
  if (!repoOrg || !repoName || !providerOrHost) {
    return null;
  }

  const provider = getProviderConfigBySourceOrHost(providerOrHost);

  return provider?.canConstructHostedRepoUrl
    ? `https://${provider.source}/${repoOrg}/${repoName}`
    : null;
};

const forgejoIcon = (
  <ForgejoLogo
    role="img"
    aria-label="Forgejo"
    style={{ width: '1em', height: '1em', color: 'inherit' }}
  />
);

const GIT_ICONS: Partial<Record<string, React.ReactElement>> = {
  'github.com': <GithubIcon alt="GitHub" />,
  'bitbucket.org': <BitbucketIcon alt="Bitbucket" />,
  'gitlab.com': <GitlabIcon alt="Gitlab" />,
  'forgejo.org': forgejoIcon,
  'codeberg.org': <GitlabIcon alt="Codeberg" />,
};

export const getGitIcon = (gitSource: string): React.ReactElement =>
  GIT_ICONS[findProvider(gitSource) ?? ''] ?? <GitAltIcon alt="Git" />;

export const createBranchUrl = (repoUrl?: string, branch?: string): string | undefined => {
  if (!repoUrl || !branch) {
    return undefined;
  }

  let parsed: gitUrlParse.GitUrl;
  try {
    parsed = gitUrlParse(repoUrl);
  } catch {
    return undefined;
  }

  const provider = findProvider(parsed.resource);
  if (!provider) {
    return undefined;
  }

  const cleanUrl = repoUrl.replace(/\.git$/, '');
  return createGitBranchURL(cleanUrl, branch, provider) ?? undefined;
};