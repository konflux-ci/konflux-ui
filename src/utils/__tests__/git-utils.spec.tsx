import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { createBranchUrl, getGitIcon, getGitPath } from '../git-utils';

describe('git-utils', () => {
  describe('getGitIcon', () => {
    it('should return GitHub icon', () => {
      const result = render(getGitIcon('github.com'));
      expect(result.baseElement.querySelector('svg').getAttribute('alt')).toBe('GitHub');
    });

    it('should return Bitbucket icon', () => {
      const result = render(getGitIcon('bitbucket.org'));
      expect(result.baseElement.querySelector('svg').getAttribute('alt')).toBe('Bitbucket');
    });

    it('should return Gitlab icon', () => {
      const result = render(getGitIcon('gitlab.com'));
      expect(result.baseElement.querySelector('svg').getAttribute('alt')).toBe('Gitlab');
    });

    it('should return Git icon', () => {
      const result = render(getGitIcon('customrepo.com'));
      expect(result.baseElement.querySelector('svg').getAttribute('alt')).toBe('Git');
    });
  });

  describe('getGitPath', () => {
    it('should return GitHub path', () => {
      const result = getGitPath('github.com', 'org', 'test');
      expect(result).toBe('/tree/org/test');
    });

    it('should return Bitbucket path', () => {
      const result = getGitPath('bitbucket.org', 'org', 'test');
      expect(result).toBe('/branch/org/test');
    });

    it('should return Gitlab path', () => {
      const result = getGitPath('gitlab.com', 'org', 'test');
      expect(result).toBe('/-/tree/org/test');
    });

    it('should return Forgejo path for forgejo.org domains', () => {
      const result = getGitPath('v14.next.forgejo.org', 'main', 'docs');
      expect(result).toBe('/src/branch/main/docs');
    });

    it('should return empty Git path for unknown source', () => {
      const result = getGitPath('customrepo.com', 'org', 'test');
      expect(result).toBe('');
    });

    it('should return empty Git path when no revision is provided', () => {
      const result = getGitPath('customrepo.com', '', 'test');
      expect(result).toBe('');
    });

    it('should return correct path for self hosted gitlab internal instance', () => {
      const result = getGitPath('customrepo.com', 'org', 'test', 'gitlab.cee.redhat.com');
      expect(result).toBe('/-/tree/org/test');
    });

    it('should return correct path for self hosted instance', () => {
      const result = getGitPath('customrepo.com', 'org', 'test', 'gitlab.abcd.org.com');
      expect(result).toBe('');
    });
  });

  describe('createBranchUrl', () => {
    it('should return undefined when repoUrl is undefined', () => {
      expect(createBranchUrl(undefined, 'main')).toBeUndefined();
    });

    it('should return undefined when branch is undefined', () => {
      expect(createBranchUrl('https://github.com/org/repo', undefined)).toBeUndefined();
    });

    it('should return undefined when both params are undefined', () => {
      expect(createBranchUrl(undefined, undefined)).toBeUndefined();
    });

    it('should return undefined when repoUrl is empty', () => {
      expect(createBranchUrl('', 'main')).toBeUndefined();
    });

    it('should return undefined when branch is empty', () => {
      expect(createBranchUrl('https://github.com/org/repo', '')).toBeUndefined();
    });

    it('should construct GitHub branch URL', () => {
      expect(createBranchUrl('https://github.com/org/repo', 'main')).toBe(
        'https://github.com/org/repo/tree/main',
      );
    });

    it('should construct GitLab branch URL', () => {
      expect(createBranchUrl('https://gitlab.com/org/repo', 'develop')).toBe(
        'https://gitlab.com/org/repo/-/tree/develop',
      );
    });

    it('should strip .git suffix', () => {
      expect(createBranchUrl('https://gitlab.com/org/repo.git', 'develop')).toBe(
        'https://gitlab.com/org/repo/-/tree/develop',
      );
    });

    it('should construct Forgejo branch URL', () => {
      expect(createBranchUrl('https://forgejo.org/org/repo', 'feature-branch')).toBe(
        'https://forgejo.org/org/repo/src/branch/feature-branch',
      );
    });

    it('should construct Codeberg branch URL', () => {
      expect(createBranchUrl('https://codeberg.org/org/repo', 'release-1.0')).toBe(
        'https://codeberg.org/org/repo/src/branch/release-1.0',
      );
    });

    it('should return undefined for unknown git providers', () => {
      expect(createBranchUrl('https://bitbucket.org/org/repo', 'main')).toBeUndefined();
    });

    it('should return undefined for a non-parseable URL', () => {
      expect(createBranchUrl('not-a-url', 'main')).toBeUndefined();
    });

    it('should not match hostnames that contain a provider name as a substring', () => {
      expect(createBranchUrl('https://notgithub.com/org/repo', 'main')).toBeUndefined();
      expect(createBranchUrl('https://mygitlab.com/org/repo', 'main')).toBeUndefined();
    });

    it('should match subdomains of known providers', () => {
      expect(createBranchUrl('https://v14.next.forgejo.org/org/repo', 'main')).toBe(
        'https://v14.next.forgejo.org/org/repo/src/branch/main',
      );
    });

    it('should match self-hosted GitLab instances', () => {
      expect(createBranchUrl('https://gitlab.cee.redhat.com/org/repo', 'main')).toBe(
        'https://gitlab.cee.redhat.com/org/repo/-/tree/main',
      );
    });

    it('should match self-hosted Gitea instances', () => {
      expect(createBranchUrl('https://gitea.mycompany.com/org/repo', 'main')).toBe(
        'https://gitea.mycompany.com/org/repo/src/branch/main',
      );
    });

    it('should handle branches with dots', () => {
      expect(createBranchUrl('https://github.com/org/repo', 'ver-1.0')).toBe(
        'https://github.com/org/repo/tree/ver-1.0',
      );
    });

    it('should handle branches with slashes', () => {
      expect(createBranchUrl('https://github.com/org/repo', 'feature/my-branch')).toBe(
        'https://github.com/org/repo/tree/feature/my-branch',
      );
    });
  });
});
