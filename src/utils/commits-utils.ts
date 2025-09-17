import { PipelineRunEventType, PipelineRunLabel, PipelineRunType } from '../consts/pipelinerun';
import { SnapshotLabels } from '../consts/snapshots';
import { PipelineRunKind, Commit } from '../types';
import { Snapshot } from '../types/coreBuildService';
import { runStatus } from './pipeline-utils';
import { getSourceUrl, stripQueryStringParams } from './pipelinerun-utils';

export const statuses = [
  runStatus.Running,
  runStatus.Cancelled,
  runStatus.Failed,
  runStatus.Pending,
  runStatus.Succeeded,
];

export const getCommitSha = (pipelineRun: PipelineRunKind) =>
  pipelineRun?.metadata.labels?.[PipelineRunLabel.COMMIT_LABEL] ||
  pipelineRun?.metadata.labels?.[PipelineRunLabel.TEST_SERVICE_COMMIT] ||
  pipelineRun?.metadata.annotations?.[PipelineRunLabel.COMMIT_ANNOTATION] ||
  pipelineRun?.metadata?.annotations?.[PipelineRunLabel.TEST_SERVICE_COMMIT];

export const createCommitObjectFromPLR = (plr: PipelineRunKind): Commit => {
  if (!plr || !getCommitSha(plr)) {
    return null;
  }
  const commitSHA = getCommitSha(plr);
  const commitBranch = plr.metadata.annotations?.[PipelineRunLabel.COMMIT_BRANCH_ANNOTATION] ?? '';
  const commitUser = plr.metadata.annotations?.[PipelineRunLabel.COMMIT_USER_LABEL];
  const creationTime = plr.metadata.creationTimestamp;
  const application = plr.metadata.labels[PipelineRunLabel.APPLICATION];
  const component = plr.metadata.labels[PipelineRunLabel.COMPONENT] ?? '';
  const repoName = plr.metadata.labels[PipelineRunLabel.COMMIT_REPO_URL_LABEL];
  const repoURL = getSourceUrl(plr);
  const repoOrg =
    plr.metadata.labels[PipelineRunLabel.COMMIT_REPO_ORG_LABEL] ||
    plr.metadata.annotations[PipelineRunLabel.COMMIT_REPO_ORG_LABEL];
  const shaURL =
    plr.metadata.annotations?.[PipelineRunLabel.COMMIT_URL_ANNOTATION] ||
    `${repoURL}/commit/${commitSHA}`;
  const shaTitle =
    plr.metadata.annotations?.[PipelineRunLabel.COMMIT_SHA_TITLE_ANNOTATION] || 'manual build';
  const gitProvider =
    plr.metadata.labels[PipelineRunLabel.COMMIT_PROVIDER_LABEL] ||
    plr.metadata.annotations[PipelineRunLabel.COMMIT_PROVIDER_LABEL];
  const pullRequestNumber = plr.metadata.labels[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL] ?? '';
  const eventType = plr.metadata.labels[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL];
  const isPullRequest =
    plr.metadata.labels[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL] === PipelineRunEventType.PULL;

  return {
    metadata: {
      uid: commitSHA,
      name: commitSHA,
    },
    components: [component],
    user: commitUser,
    sha: commitSHA,
    shaURL,
    repoName,
    repoURL,
    repoOrg,
    gitProvider,
    branch: commitBranch,
    creationTime,
    pipelineRuns: [plr],
    application,
    shaTitle,
    eventType,
    isPullRequest,
    pullRequestNumber,
  };
};

const updateCommitObject = (plr: PipelineRunKind, commit: Commit): Commit => {
  const newCommit = commit;
  const creationTime = plr.metadata.creationTimestamp;
  const component = plr.metadata.labels[PipelineRunLabel.COMPONENT] ?? '';

  if (new Date(newCommit.creationTime).getTime() > new Date(creationTime).getTime()) {
    newCommit.creationTime = creationTime;
  }
  if (!newCommit.components) {
    newCommit.components = [component];
  } else {
    const compIndex = newCommit.components.findIndex((comp) => comp === component);
    if (compIndex < 0) newCommit.components.push(component);
  }
  newCommit.pipelineRuns.push(plr);
  return newCommit;
};

export const getCommitsFromPLRs = (plrList: PipelineRunKind[], limit?: number): Commit[] => {
  const commits: Commit[] = [];
  plrList.forEach((plr) => {
    const commitSHA = getCommitSha(plr);
    if (commitSHA) {
      const existingCommitIndex = commits.findIndex((commit) => commit.sha === commitSHA);
      if (existingCommitIndex > -1) {
        commits[existingCommitIndex] = updateCommitObject(plr, commits[existingCommitIndex]);
      } else {
        commits.push(createCommitObjectFromPLR(plr));
      }
    }
  });
  const sortedCommits = commits
    .map((c) => {
      const pipelineRuns = c.pipelineRuns.sort(
        (a, b) => new Date(b.status?.startTime).getTime() - new Date(a.status?.startTime).getTime(),
      );
      return { ...c, pipelineRuns };
    })
    .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
  return limit && limit < sortedCommits.length ? sortedCommits.slice(0, limit) : sortedCommits;
};

export const getLatestCommitFromPipelineRuns = (pipelineruns?: PipelineRunKind[]) => {
  if (!pipelineruns.length) {
    return null;
  }
  return createCommitObjectFromPLR(pipelineruns[0]);
};

export const getCommitDisplayName = (commit: Commit): string => commit.sha.slice(0, 7);

export const getCommitShortName = (commitName: string): string => commitName.slice(0, 7);

export const showPLRType = (plr: PipelineRunKind): string => {
  if (!plr) {
    return null;
  }
  const runType = plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL];
  if (!runType) {
    return null;
  }
  if (runType === PipelineRunType.BUILD) {
    return 'Build';
  }
  if (runType === PipelineRunType.TEST) {
    return 'Integration test';
  }
  if (runType === PipelineRunType.RELEASE) {
    return 'Release';
  }
};

export const showPLRMessage = (plr: PipelineRunKind): string => {
  const runType = plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL];
  if (!runType) {
    return null;
  }
  if (runType === PipelineRunType.BUILD) {
    return 'Build deploying';
  }
  if (runType === PipelineRunType.TEST) {
    return 'Testing';
  }
  if (runType === PipelineRunType.RELEASE) {
    return 'Releasing';
  }
};

export const createRepoUrl = (commit: Commit): string | null => {
  if (commit.gitProvider !== 'github') {
    return null;
  }
  if (commit.repoURL) {
    return commit.repoURL;
  }
  if (commit.repoName && commit.repoOrg) {
    return `https://github.com/${commit.repoOrg}/${commit.repoName}`;
  }
  return null;
};

export const createRepoBranchURL = (commit: Commit): string | null => {
  const repoUrl = createRepoUrl(commit);
  if (commit.branch && repoUrl) {
    return `${repoUrl}/tree/${commit.branch}`;
  }
  return null;
};

export const createRepoPullRequestURL = (commit: Commit): string | null => {
  const repoURL = createRepoUrl(commit);
  if (commit.pullRequestNumber && repoURL) {
    return `${repoURL}/pull/${commit.pullRequestNumber}`;
  }
  return null;
};

export const getSnapshotSourceUrl = (snapshot: Snapshot): string => {
  if (!snapshot) {
    return undefined;
  }

  const repoFromBuildServiceAnnotation =
    snapshot.metadata?.annotations?.[SnapshotLabels.BUILD_SERVICE_REPO_ANNOTATION];
  const repoFromPACAnnotation =
    snapshot.metadata?.annotations?.[SnapshotLabels.COMMIT_FULL_REPO_URL_ANNOTATION] ??
    snapshot.metadata?.annotations?.[SnapshotLabels.PAC_REPO_URL];

  return stripQueryStringParams(repoFromPACAnnotation || repoFromBuildServiceAnnotation);
};

export const getCommitShaFromSnapshot = (snapshot: Snapshot) =>
  snapshot?.metadata.labels?.[SnapshotLabels.COMMIT_LABEL] ||
  snapshot?.metadata.labels?.[SnapshotLabels.PAC_SHA_LABEL] ||
  snapshot?.metadata.annotations?.[SnapshotLabels.COMMIT_ANNOTATION] ||
  snapshot?.metadata?.annotations?.[SnapshotLabels.PAC_SHA_LABEL];

export const createCommitObjectFromSnapshot = (snapshot: Snapshot): Commit => {
  const commitSHA = getCommitShaFromSnapshot(snapshot);
  if (!snapshot || !commitSHA) {
    return null;
  }

  const commitBranch =
    snapshot.metadata.annotations?.[SnapshotLabels.COMMIT_BRANCH_ANNOTATION] ??
    snapshot.metadata.annotations?.[SnapshotLabels.PAC_BRANCH] ??
    '';
  const commitUser =
    snapshot.metadata.annotations?.[SnapshotLabels.COMMIT_USER_LABEL] ??
    snapshot.metadata.annotations?.[SnapshotLabels.PAC_SENDER];
  const creationTime = snapshot.metadata.creationTimestamp;
  const application = snapshot.metadata.labels[SnapshotLabels.APPLICATION];
  const component = snapshot.metadata.labels[SnapshotLabels.COMPONENT] ?? '';
  const repoName = snapshot.metadata.labels[SnapshotLabels.PAC_URL_REPOSITORY_LABEL];
  const repoURL = getSnapshotSourceUrl(snapshot);
  const repoOrg =
    snapshot.metadata.labels[SnapshotLabels.PAC_URL_ORG_LABEL] ||
    snapshot.metadata.annotations[SnapshotLabels.PAC_URL_ORG_LABEL];
  const shaURL =
    snapshot.metadata.annotations?.[SnapshotLabels.PAC_SHA_URL_ANNOTATION] ||
    `${repoURL}/commit/${commitSHA}`;
  const shaTitle =
    snapshot.metadata.annotations?.[SnapshotLabels.PAC_SHA_TITLE_ANNOTATION] || 'manual build';
  const gitProvider =
    snapshot.metadata.labels[SnapshotLabels.PAC_GIT_PROVIDER] ||
    snapshot.metadata.annotations[SnapshotLabels.PAC_GIT_PROVIDER];
  const pullRequestNumber = snapshot.metadata.labels[SnapshotLabels.PAC_PULL_REQUEST_LABEL] ?? '';
  const eventType = snapshot.metadata.labels[SnapshotLabels.PAC_EVENT_TYPE_LABEL];
  const isPullRequest =
    snapshot.metadata.labels[SnapshotLabels.PAC_EVENT_TYPE_LABEL] === PipelineRunEventType.PULL;

  return {
    metadata: {
      uid: commitSHA,
      name: commitSHA,
    },
    components: [component],
    user: commitUser,
    sha: commitSHA,
    shaURL,
    repoName,
    repoURL,
    repoOrg,
    gitProvider,
    branch: commitBranch,
    creationTime,
    pipelineRuns: [],
    application,
    shaTitle,
    eventType,
    isPullRequest,
    pullRequestNumber,
  };
};
