import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import ForgejoLogo from '../shared/assets/forgejo-logo.svg';

const isForgejoSource = (gitSource: string): boolean =>
  gitSource === 'forgejo.org' || gitSource.endsWith('.forgejo.org');

const getPathPrefix = (gitSource: string, domain?: string): string | null => {
  if (isForgejoSource(gitSource)) {
    return '/src/branch';
  }
  if (domain === 'gitlab.cee.redhat.com') {
    return '/-/tree';
  }
  switch (gitSource) {
    case 'github.com':
      return '/tree';
    case 'bitbucket.org':
      return '/branch';
    case 'gitlab.com':
      return '/-/tree';
    default:
      return null;
  }
};

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

  const prefix: string = getPathPrefix(gitSource, domain);
  if (prefix === null) {
    // omit path for unknown source
    return '';
  }
  return `${prefix}/${revision}${path ? `/${path}` : ''}`;
};

export const getGitIcon = (gitSource: string): React.ReactElement => {
  const provider = isForgejoSource(gitSource) ? 'forgejo' : gitSource;

  switch (provider) {
    case 'github.com':
      return <GithubIcon alt="GitHub" />;
    case 'bitbucket.org':
      return <BitbucketIcon alt="Bitbucket" />;
    case 'gitlab.com':
      return <GitlabIcon alt="Gitlab" />;
    case 'forgejo':
      return (
        <ForgejoLogo
          role="img"
          aria-label="Forgejo"
          style={{ width: '1em', height: '1em', color: 'inherit' }}
        />
      );
    default:
      return <GitAltIcon alt="Git" />;
  }
};
