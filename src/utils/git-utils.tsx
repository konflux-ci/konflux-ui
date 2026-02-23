import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';

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

type BranchPathBuilder = (branch: string) => string;

const providerBranchPaths: [string, BranchPathBuilder][] = [
  ['github.com', (branch) => `/tree/${branch}`],
  ['gitlab.com', (branch) => `/-/tree/${branch}`],
  ['forgejo.org', (branch) => `/src/branch/${branch}`],
  ['codeberg.org', (branch) => `/src/branch/${branch}`],
];

export const createBranchUrl = (repoUrl?: string, branch?: string): string | undefined => {
  if (!repoUrl || !branch) {
    return undefined;
  }

  const cleanUrl = repoUrl.replace(/\.git$/, '');

  let hostname: string;
  try {
    hostname = new URL(cleanUrl).hostname;
  } catch {
    return undefined;
  }

  const match = providerBranchPaths.find(
    ([host]) => hostname === host || hostname.endsWith(`.${host}`),
  );

  return match ? `${cleanUrl}${match[1](branch)}` : undefined;
};
