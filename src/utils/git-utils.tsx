import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import gitUrlParse from 'git-url-parse';
import ForgejoLogo from '../shared/assets/forgejo-logo.svg';

type ProviderConfig = {
  source: string;
  branchPath: (branch: string) => string;
  commitPath: (sha: string) => string;
  selfHostedKeywords?: string[]; // hostname segments that identify self hosted instances
};

const providers: ProviderConfig[] = [
  {
    source: 'github.com',
    branchPath: (branch) => `/tree/${branch}`,
    commitPath: (sha) => `/commit/${sha}`,
  },
  {
    source: 'bitbucket.org',
    branchPath: (branch) => `/branch/${branch}`,
    commitPath: (sha) => `/commits/${sha}`,
  },
  {
    source: 'gitlab.com',
    branchPath: (branch) => `/-/tree/${branch}`,
    commitPath: (sha) => `/-/commit/${sha}`,
    selfHostedKeywords: ['gitlab'],
  },
  {
    source: 'forgejo.org',
    branchPath: (branch) => `/src/branch/${branch}`,
    commitPath: (sha) => `/commit/${sha}`,
    selfHostedKeywords: ['forgejo', 'gitea'],
  },
  {
    source: 'codeberg.org',
    branchPath: (branch) => `/src/branch/${branch}`,
    commitPath: (sha) => `/commit/${sha}`,
  },
];

const findProvider = (parsed: gitUrlParse.GitUrl): ProviderConfig | undefined => {
  const hostSegments: string[] = parsed.resource.split('.');
  return providers.find((p) => {
    if (parsed.source === p.source) {
      return true;
    }

    const keywords = p.selfHostedKeywords;
    return keywords && hostSegments.some((seg) => keywords.includes(seg));
  });
};

const findProviderByHost = (host: string): ProviderConfig | undefined => {
  const segments = host.split('.');
  return providers.find(
    (p) => p.source === host || p.selfHostedKeywords?.some((kw) => segments.includes(kw)),
  );
};

export const getGitPath = (
  gitSource: string,
  revision: string,
  path?: string,
  domain?: string,
): string => {
  if (!revision) return '';
  const provider = findProviderByHost(domain ?? gitSource);
  if (!provider) return '';
  return `${provider.branchPath(revision)}${path ? `/${path}` : ''}`;
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
  GIT_ICONS[findProviderByHost(gitSource)?.source ?? ''] ?? <GitAltIcon alt="Git" />;

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

  const provider = findProvider(parsed);
  if (!provider) {
    return undefined;
  }

  const cleanUrl = repoUrl.replace(/\.git$/, '');
  return `${cleanUrl}${provider.branchPath(branch)}`;
};
