import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import gitUrlParse from 'git-url-parse';
import ForgejoLogo from '../shared/assets/forgejo-logo.svg';

const PROVIDERS: { source: string; selfHostedKeywords?: string[] }[] = [
  { source: 'github.com' },
  { source: 'bitbucket.org' },
  { source: 'gitlab.com', selfHostedKeywords: ['gitlab'] },
  { source: 'forgejo.org', selfHostedKeywords: ['forgejo', 'gitea'] },
  { source: 'codeberg.org' },
];

const PATH_PREFIX: Record<string, string> = {
  'github.com': '/tree',
  'bitbucket.org': '/branch',
  'gitlab.com': '/-/tree',
};

export const findProvider = (hostOrUrl: string): string | undefined => {
  const host = hostOrUrl.includes('://')
    ? (gitUrlParse(hostOrUrl) as gitUrlParse.GitUrl).resource
    : hostOrUrl;
  const segments = host.split('.');
  return PROVIDERS.find(
    (p) => p.source === host || p.selfHostedKeywords?.some((kw) => segments.includes(kw)),
  )?.source;
};

const getPathPrefix = (gitSource: string, domain?: string): string | null =>
  gitSource === 'forgejo.org' || gitSource.endsWith('.forgejo.org')
    ? '/src/branch'
    : domain === 'gitlab.cee.redhat.com'
      ? '/-/tree'
      : PATH_PREFIX[gitSource] ?? null;

export const getGitPath = (
  gitSource: string,
  revision: string,
  path?: string,
  domain?: string,
): string => {
  const prefix = getPathPrefix(gitSource, domain);
  return !revision || !prefix ? '' : `${prefix}/${revision}${path ? `/${path}` : ''}`;
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
