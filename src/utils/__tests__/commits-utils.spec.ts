import { mockSnapshot } from '../../__data__/mock-snapshots';
import {
  pipelineWithoutCommits,
  pipelineWithCommits,
  mockCommits,
} from '../../components/Commits/__data__/pipeline-with-commits';
import { Commit } from '../../types';
import {
  createCommitObjectFromPLR,
  createRepoBranchURL,
  createRepoPullRequestURL,
  createRepoUrl,
  getCommitDisplayName,
  getCommitsFromPLRs,
  getCommitShortName,
  showPLRMessage,
  showPLRType,
  createCommitObjectFromSnapshot,
} from '../commits-utils';

describe('commit-utils', () => {
  describe('getCommitsFromPLRs', () => {
    it('Should return 8 commits with correct details', () => {
      const result = getCommitsFromPLRs(pipelineWithCommits);
      expect(result.length).toBe(8);
      expect(result[0].sha).toBe('commit777');
      expect(result[0].branch).toBeFalsy();
      expect(result[0].components[0]).toBe('manual-build-component');
      expect(result[0].user).toBe(undefined);
      expect(result[0].pipelineRuns).toHaveLength(1);
      expect(result[1].sha).toBe('commit123');
      expect(result[1].branch).toBe('branch_1');
      expect(result[1].components[0]).toBe('sample-component');
      expect(result[1].user).toBe('abhi');
      expect(result[1].pipelineRuns).toHaveLength(5);
      expect(result[result.length - 1].sha).toBe('commitabc');
      expect(result[result.length - 1].branch).toBe('branch_x');
      expect(result[result.length - 1].components.length).toBe(2);
      expect(result[result.length - 1].user).toBe('abhi');
      expect(result[result.length - 1].pipelineRuns).toHaveLength(2);
      expect(result[1].isPullRequest).toBe(true);
      expect(result[1].pullRequestNumber).toBe('11');
    });

    it('Should return 2 commits with correct details', () => {
      const result = getCommitsFromPLRs(pipelineWithCommits.slice(0, 4));
      expect(result.length).toBe(2);
      expect(result[0].sha).toBe('commit123');
      expect(result[0].branch).toBe('branch_1');
      expect(result[0].components[0]).toBe('sample-component');
      expect(result[0].user).toBe('abhi');
      expect(result[0].pipelineRuns).toHaveLength(1);
      expect(result[result.length - 1].sha).toBe('commit14rt');
      expect(result[result.length - 1].branch).toBe('branch_b');
      expect(result[result.length - 1].components[0]).toBe('go-3');
      expect(result[result.length - 1].user).toBe('abhi');
      expect(result[result.length - 1].pipelineRuns).toHaveLength(3);
      expect(result[result.length - 1].creationTime).toBe('2022-06-20T12:47:24Z');
    });

    it('Should return 0 commits', () => {
      const result = getCommitsFromPLRs(pipelineWithoutCommits);
      expect(result.length).toBe(0);
    });
  });

  describe('createCommitObjectFromPLR: create commit from plr', () => {
    it('Should return correct commit', () => {
      const result = createCommitObjectFromPLR(pipelineWithCommits[0]);
      expect(result).not.toBe(null);
      expect(result.sha).toBe('commit123');
      expect(result.branch).toBe('branch_1');
      expect(result.components[0]).toBe('sample-component');
      expect(result.user).toBe('abhi');
    });

    it('Should return no commit', () => {
      const result = createCommitObjectFromPLR(pipelineWithoutCommits[0]);
      expect(result).toBe(null);
    });

    it('Should return isPullRequest true for pac based pipelinerun', () => {
      const result = createCommitObjectFromPLR(pipelineWithCommits[1]);
      expect(result.isPullRequest).toBe(true);
    });

    it('Should return pullRequestNumber true for pac based pipelinerun', () => {
      const result = createCommitObjectFromPLR(pipelineWithCommits[1]);
      expect(result.pullRequestNumber).toBe('11');
    });

    it('Should return isPullRequest false if the labels are missing', () => {
      const result = createCommitObjectFromPLR(pipelineWithCommits[3]);
      expect(result.isPullRequest).toBe(false);
      expect(result.pullRequestNumber).toBe('');
    });

    it('Should not return undefined value in the pullRequestNumber', () => {
      const missingPRnumberLabel = {
        ...pipelineWithCommits[1],
        metadata: {
          ...pipelineWithCommits[1].metadata,
          labels: {
            ...pipelineWithCommits[1].metadata.labels,
            'pipelinesascode.tekton.dev/pull-request': undefined,
          },
        },
      };
      const result = createCommitObjectFromPLR(missingPRnumberLabel);
      expect(result.isPullRequest).toBe(true);
      expect(result.pullRequestNumber).toBe('');
    });
  });

  describe('createCommitObjectFromSnapshot', () => {
    it('Should return correct commit', () => {
      const result = createCommitObjectFromSnapshot(mockSnapshot);
      expect(result).not.toBe(null);
      expect(result.sha).toBe('abc123def4567890');
      expect(result.branch).toBe('main');
      expect(result.components[0]).toBe('frontend-component');
      expect(result.user).toBe('test-user');
      expect(result.repoURL).toBe('https://github.com/test-org/frontend-repo');
      expect(result.shaURL).toBe(
        'https://github.com/test-org/frontend-repo/commit/abc123def4567890',
      );
      expect(result.shaTitle).toBe('Add new feature');
      expect(result.gitProvider).toBe('github');
      expect(result.application).toBe('test-app');
    });

    it('Should return null if no sha is present', () => {
      const snapshotNoSha = {
        ...mockSnapshot,
        metadata: {
          ...mockSnapshot.metadata,
          labels: {
            ...mockSnapshot.metadata.labels,
            'pac.test.appstudio.openshift.io/sha': undefined,
          },
          annotations: {
            ...mockSnapshot.metadata.annotations,
            'pac.test.appstudio.openshift.io/sha': undefined,
          },
        },
      };
      const result = createCommitObjectFromSnapshot(snapshotNoSha);
      expect(result).toBe(null);
    });

    it('Should return isPullRequest true for pull_request event type', () => {
      const result = createCommitObjectFromSnapshot(mockSnapshot);
      expect(result.isPullRequest).toBe(true);
    });

    it('Should return pullRequestNumber for pull_request snapshot', () => {
      const result = createCommitObjectFromSnapshot(mockSnapshot);
      expect(result.pullRequestNumber).toBe('42');
    });

    it('Should return isPullRequest false if the event type label is missing', () => {
      const snapshotNoEventType = {
        ...mockSnapshot,
        metadata: { ...mockSnapshot.metadata, labels: { ...mockSnapshot.metadata.labels } },
      };
      delete snapshotNoEventType.metadata.labels['pac.test.appstudio.openshift.io/event-type'];
      const result = createCommitObjectFromSnapshot(snapshotNoEventType);
      expect(result.isPullRequest).toBe(false);
      expect(result.pullRequestNumber).toBe('42');
    });

    it('Should not return undefined value in the pullRequestNumber', () => {
      const snapshotMissingPR = {
        ...mockSnapshot,
        metadata: {
          ...mockSnapshot.metadata,
          labels: {
            ...mockSnapshot.metadata.labels,
            'pac.test.appstudio.openshift.io/pull-request': undefined,
          },
        },
      };
      const result = createCommitObjectFromSnapshot(snapshotMissingPR);
      expect(result.isPullRequest).toBe(true);
      expect(result.pullRequestNumber).toBe('');
    });
  });

  describe('commit short name', () => {
    it('Should return correct displayName', () => {
      const displayName = getCommitDisplayName(mockCommits[0]);
      expect(displayName).toBe('comm012');
    });

    it('Should return correct short name', () => {
      const shortName = getCommitShortName(mockCommits[0].sha);
      expect(shortName).toBe('comm012');
    });
  });

  describe('showPLRType and Message', () => {
    it('Should return correct type for build', () => {
      const type = showPLRType(pipelineWithCommits[0]);
      expect(type).toBe('Build');
    });

    it('Should return correct type for release', () => {
      const type = showPLRType(pipelineWithCommits[1]);
      expect(type).toBe('Release');
    });

    it('Should return correct type for test', () => {
      const type = showPLRType(pipelineWithCommits[3]);
      expect(type).toBe('Integration test');
    });

    it('Should return correct message for build', () => {
      const message = showPLRMessage(pipelineWithCommits[0]);
      expect(message).toBe('Build deploying');
    });

    it('Should return correct message for release', () => {
      const message = showPLRMessage(pipelineWithCommits[1]);
      expect(message).toBe('Releasing');
    });

    it('Should return correct message for test', () => {
      const message = showPLRMessage(pipelineWithCommits[3]);
      expect(message).toBe('Testing');
    });
  });

  describe('create github branch/pull request link', () => {
    it('should return valid git url or null based on commit object', () => {
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://github.com/a/b',
          pullRequestNumber: '23',
          gitProvider: 'github',
        } as Commit),
      ).toEqual('https://github.com/a/b/pull/23');
      // Without gitProvider, still works if repoURL is present (prioritized)
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://github.com/a/b',
          pullRequestNumber: '23',
        } as Commit),
      ).toEqual('https://github.com/a/b/pull/23');
      expect(
        createRepoPullRequestURL({
          gitProvider: 'github',
          pullRequestNumber: '23',
          repoName: 'b',
          repoOrg: 'a',
        } as Commit),
      ).toEqual('https://github.com/a/b/pull/23');

      expect(
        createRepoPullRequestURL({
          gitProvider: 'github',
          repoName: 'b',
          repoOrg: 'a',
        } as Commit),
      ).toEqual(null);
    });

    it('should return valid git url or null based on commit object', () => {
      expect(
        createRepoBranchURL({
          repoURL: 'https://github.com/a/b',
          branch: 'main',
          gitProvider: 'github',
        } as Commit),
      ).toEqual('https://github.com/a/b/tree/main');
      // Without gitProvider, still works if repoURL is present (prioritized)
      expect(
        createRepoBranchURL({
          repoURL: 'https://github.com/a/b',
          branch: 'main',
        } as Commit),
      ).toEqual('https://github.com/a/b/tree/main');
      expect(
        createRepoBranchURL({
          gitProvider: 'github',
          branch: 'main',
          repoName: 'b',
          repoOrg: 'a',
        } as Commit),
      ).toEqual('https://github.com/a/b/tree/main');

      expect(
        createRepoBranchURL({
          gitProvider: 'github',
          repoName: 'b',
          repoOrg: 'a',
        } as Commit),
      ).toEqual(null);
    });
  });

  describe('createRepoUrl for multiple providers', () => {
    it('should prioritize repoURL for all providers', () => {
      // GitHub with repoURL
      expect(
        createRepoUrl({
          repoURL: 'https://github.com/org/repo',
          gitProvider: 'github',
        } as Commit),
      ).toEqual('https://github.com/org/repo');

      // GitLab with repoURL
      expect(
        createRepoUrl({
          repoURL: 'https://gitlab.com/org/repo',
          gitProvider: 'gitlab',
        } as Commit),
      ).toEqual('https://gitlab.com/org/repo');

      // Forgejo with repoURL (self-hosted)
      expect(
        createRepoUrl({
          repoURL: 'https://forgejo.example.com/org/repo',
          gitProvider: 'forgejo',
        } as Commit),
      ).toEqual('https://forgejo.example.com/org/repo');
    });

    it('should return null for gitlab when repoURL is missing', () => {
      expect(
        createRepoUrl({
          gitProvider: 'gitlab',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should return null for forgejo without repoURL', () => {
      // Forgejo is self-hosted, can't construct URL without repoURL
      expect(
        createRepoUrl({
          gitProvider: 'forgejo',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should construct github.com URL when repoURL is missing', () => {
      expect(
        createRepoUrl({
          gitProvider: 'github',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual('https://github.com/org/repo');
    });

    it('should return null for missing required fields', () => {
      // Missing gitProvider
      expect(
        createRepoUrl({
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);

      // Missing repoOrg
      expect(
        createRepoUrl({
          gitProvider: 'github',
          repoName: 'repo',
        } as Commit),
      ).toEqual(null);

      // Missing repoName
      expect(
        createRepoUrl({
          gitProvider: 'github',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should return null for unknown providers without repoURL', () => {
      expect(
        createRepoUrl({
          gitProvider: 'custom-host',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });
  });

  describe('createRepoBranchURL for multiple providers', () => {
    it('should use gitlab branch URL pattern', () => {
      expect(
        createRepoBranchURL({
          repoURL: 'https://gitlab.com/org/repo',
          branch: 'main',
          gitProvider: 'gitlab',
        } as Commit),
      ).toEqual('https://gitlab.com/org/repo/-/tree/main');

      expect(
        createRepoBranchURL({
          gitProvider: 'gitlab',
          branch: 'feature-branch',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should use forgejo branch URL pattern', () => {
      expect(
        createRepoBranchURL({
          repoURL: 'https://forgejo.example.com/org/repo',
          branch: 'main',
          gitProvider: 'forgejo',
        } as Commit),
      ).toEqual('https://forgejo.example.com/org/repo/src/branch/main');

      expect(
        createRepoBranchURL({
          repoURL: 'https://codeberg.org/org/repo',
          branch: 'develop',
          gitProvider: 'forgejo',
        } as Commit),
      ).toEqual('https://codeberg.org/org/repo/src/branch/develop');
    });

    it('should return null for forgejo without repoURL', () => {
      expect(
        createRepoBranchURL({
          gitProvider: 'forgejo',
          branch: 'main',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should use default pattern for github', () => {
      expect(
        createRepoBranchURL({
          repoURL: 'https://github.com/org/repo',
          branch: 'main',
          gitProvider: 'github',
        } as Commit),
      ).toEqual('https://github.com/org/repo/tree/main');
    });

    it('should return null when branch is missing', () => {
      expect(
        createRepoBranchURL({
          repoURL: 'https://gitlab.com/org/repo',
          gitProvider: 'gitlab',
        } as Commit),
      ).toEqual(null);
    });
  });

  describe('createRepoPullRequestURL for multiple providers', () => {
    it('should use gitlab merge request URL pattern', () => {
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://gitlab.com/org/repo',
          pullRequestNumber: '42',
          gitProvider: 'gitlab',
        } as Commit),
      ).toEqual('https://gitlab.com/org/repo/-/merge_requests/42');

      expect(
        createRepoPullRequestURL({
          gitProvider: 'gitlab',
          pullRequestNumber: '100',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should use forgejo pull request URL pattern', () => {
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://forgejo.example.com/org/repo',
          pullRequestNumber: '123',
          gitProvider: 'forgejo',
        } as Commit),
      ).toEqual('https://forgejo.example.com/org/repo/pulls/123');

      expect(
        createRepoPullRequestURL({
          repoURL: 'https://codeberg.org/org/repo',
          pullRequestNumber: '456',
          gitProvider: 'forgejo',
        } as Commit),
      ).toEqual('https://codeberg.org/org/repo/pulls/456');
    });

    it('should return null for forgejo without repoURL', () => {
      expect(
        createRepoPullRequestURL({
          gitProvider: 'forgejo',
          pullRequestNumber: '42',
          repoName: 'repo',
          repoOrg: 'org',
        } as Commit),
      ).toEqual(null);
    });

    it('should use default pattern for github', () => {
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://github.com/org/repo',
          pullRequestNumber: '789',
          gitProvider: 'github',
        } as Commit),
      ).toEqual('https://github.com/org/repo/pull/789');
    });

    it('should return null when pullRequestNumber is missing', () => {
      expect(
        createRepoPullRequestURL({
          repoURL: 'https://gitlab.com/org/repo',
          gitProvider: 'gitlab',
        } as Commit),
      ).toEqual(null);
    });
  });
});
