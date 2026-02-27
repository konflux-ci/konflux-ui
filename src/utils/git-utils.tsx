import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import gitUrlParse from 'git-url-parse';

export const getGitPath = (
  gitSource: string,
  revision: string,
  path?: string,
  domain?: string,
): string => {
  if (!revision) {
    // main or master branch but we cannot construct the url
    return '';
  }
  let prefix: string;
  switch (gitSource) {
    case 'github.com':
      prefix = '/tree';
      break;
    case 'bitbucket.org':
      prefix = '/branch';
      break;
    case 'gitlab.com':
      prefix = '/-/tree';
      break;
    default:
      if (gitSource.endsWith('forgejo.org')) {
        prefix = '/src/branch';
        break;
      }
      if (domain === 'gitlab.cee.redhat.com') {
        prefix = '/-/tree';
        break;
      }
      // omit path for unknown source
      return '';
  }
  return `${prefix}/${revision}${path ? `/${path}` : ''}`;
};

export const getGitIcon = (gitSource: string): React.ReactElement => {
  switch (gitSource) {
    case 'github.com':
      return <GithubIcon alt="GitHub" />;
    case 'bitbucket.org':
      return <BitbucketIcon alt="Bitbucket" />;
    case 'gitlab.com':
      return <GitlabIcon alt="Gitlab" />;
    default:
      return <GitAltIcon alt="Git" />;
  }
};

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
