import * as React from 'react';
import { render } from '@testing-library/react';
import { detectGitType, GitProvider, routeDecoratorIcon } from '../git-utils';

jest.mock(
  '../../assets/forgejo-logo.svg',
  () => (props: { 'aria-label'?: string }) => React.createElement('svg', props),
);

describe('shared git-utils', () => {
  describe('detectGitType', () => {
    it('returns GITHUB for github.com URLs', () => {
      expect(detectGitType('https://github.com/org/repo')).toBe(GitProvider.GITHUB);
      expect(detectGitType('https://www.github.com/org/repo')).toBe(GitProvider.GITHUB);
    });

    it('returns BITBUCKET for bitbucket.org URLs', () => {
      expect(detectGitType('https://bitbucket.org/org/repo')).toBe(GitProvider.BITBUCKET);
    });

    it('returns GITLAB for gitlab.com URLs', () => {
      expect(detectGitType('https://gitlab.com/org/repo')).toBe(GitProvider.GITLAB);
    });

    it('returns FORGEJO for forgejo.org URLs', () => {
      expect(detectGitType('https://forgejo.org/org/repo')).toBe(GitProvider.FORGEJO);
      expect(detectGitType('https://www.forgejo.org/org/repo')).toBe(GitProvider.FORGEJO);
    });

    it('returns INVALID for non-URLs', () => {
      expect(detectGitType('not a url')).toBe(GitProvider.INVALID);
    });

    it('returns UNSURE for unknown git hosts', () => {
      expect(detectGitType('https://other.com/org/repo')).toBe(GitProvider.UNSURE);
    });
  });

  describe('routeDecoratorIcon', () => {
    it('returns GitHub icon for github.com URL', () => {
      const result = render(routeDecoratorIcon('https://github.com/org/repo'));
      expect(result.baseElement.querySelector('svg')).toBeInTheDocument();
    });

    it('returns Bitbucket icon for bitbucket.org URL', () => {
      const result = render(routeDecoratorIcon('https://bitbucket.org/org/repo'));
      expect(result.baseElement.querySelector('svg')).toBeInTheDocument();
    });

    it('returns GitLab icon for gitlab.com URL', () => {
      const result = render(routeDecoratorIcon('https://gitlab.com/org/repo'));
      expect(result.baseElement.querySelector('svg')).toBeInTheDocument();
    });

    it('returns Forgejo icon for forgejo.org URL', () => {
      const result = render(routeDecoratorIcon('https://forgejo.org/org/repo'));
      expect(result.baseElement.querySelector('svg')).toBeInTheDocument();
      expect(result.baseElement.querySelector('svg')).toHaveAttribute('aria-label', 'Source code');
      expect(result.baseElement.querySelector('svg')).toHaveAttribute('role', 'img');
    });

    it('returns null for invalid URL', () => {
      const result = render(routeDecoratorIcon('not a url'));
      expect(result.baseElement.querySelector('svg')).not.toBeInTheDocument();
      expect(result.baseElement.textContent).toBe('');
    });

    it('returns Git icon for unknown host URL', () => {
      const result = render(routeDecoratorIcon('https://other.com/org/repo'));
      expect(result.baseElement.querySelector('svg')).toBeInTheDocument();
    });
  });
});
