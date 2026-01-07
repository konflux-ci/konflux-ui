/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
/**
 * enums have dublicate values COMMIT_TYPE_LABEL, PIPELINE_TYPE
 */

export enum PipelineRunLabel {
  APPLICATION = 'appstudio.openshift.io/application',
  COMPONENT = 'appstudio.openshift.io/component',
  PIPELINE_USED_BY = 'pipelines.openshift.io/used-by',
  PIPELINE_TYPE = 'pipelines.appstudio.openshift.io/type',
  PIPELINE_NAME = 'tekton.dev/pipeline',
  PIPELINERUN_NAME = 'tekton.dev/pipelineRun',
  COMMIT_LABEL = 'pipelinesascode.tekton.dev/sha',
  COMMIT_ANNOTATION = 'build.appstudio.redhat.com/commit_sha',
  COMMIT_URL_ANNOTATION = 'pipelinesascode.tekton.dev/sha-url',
  COMMIT_BRANCH_ANNOTATION = 'build.appstudio.redhat.com/target_branch',
  COMMIT_USER_LABEL = 'pipelinesascode.tekton.dev/sender',
  COMMIT_REPO_ORG_LABEL = 'pipelinesascode.tekton.dev/url-org',
  COMMIT_REPO_URL_LABEL = 'pipelinesascode.tekton.dev/url-repository',
  COMMIT_FULL_REPO_URL_ANNOTATION = 'pipelinesascode.tekton.dev/repo-url',
  COMMIT_PROVIDER_LABEL = 'pipelinesascode.tekton.dev/git-provider',
  COMMIT_SHA_TITLE_ANNOTATION = 'pipelinesascode.tekton.dev/sha-title',
  COMMIT_TYPE_LABEL = 'pipelines.appstudio.openshift.io/type',
  REPOSITORY_NAME = 'pipelinesascode.tekton.dev/url-repository',
  SNAPSHOT = 'appstudio.openshift.io/snapshot',
  COMMIT_EVENT_TYPE_LABEL = 'pipelinesascode.tekton.dev/event-type',
  PULL_REQUEST_NUMBER_LABEL = 'pipelinesascode.tekton.dev/pull-request',
  CREATE_SNAPSHOT_STATUS = 'test.appstudio.openshift.io/create-snapshot-status',
  RELEASE_NAMESPACE = 'release.appstudio.openshift.io/namespace',

  TEST_COMMIT_USER_LABEL = 'pac.test.appstudio.openshift.io/sender',
  TEST_REPOSITORY_NAME = 'pac.test.appstudio.openshift.io/url-repository',
  TEST_REPO_ORG_LABEL = 'pac.test.appstudio.openshift.io/url-org',
  TEST_COMMIT_EVENT_TYPE_LABEL = 'pac.test.appstudio.openshift.io/event-type',
  TEST_COMMIT_PROVIDER_LABEL = 'pac.test.appstudio.openshift.io/git-provider',
  TEST_SERVICE_COMMIT = 'pac.test.appstudio.openshift.io/sha',
  TEST_SERVICE_EVENT_TYPE_LABEL = 'pac.test.appstudio.openshift.io/event-type',
  TEST_SERVICE_SCENARIO = 'test.appstudio.openshift.io/scenario',
  ASEB_APPLICATION = 'appstudio.application',

  CHAINS_SIGNED_ANNOTATION = 'chains.tekton.dev/signed',
  BUILD_IMAGE_ANNOTATION = 'build.appstudio.openshift.io/image',
  BUILD_SERVICE_REPO_ANNOTATION = 'build.appstudio.openshift.io/repo',
}

export enum PipelineRunType {
  BUILD = 'build',
  RELEASE = 'release',
  TEST = 'test',
  TENANT = 'tenant',
  MANAGED = 'managed',
  FINAL = 'final',
}

export enum PipelineRunEventType {
  PUSH = 'push',
  GITLAB_PUSH = 'Push',
  PULL = 'pull_request',
  INCOMING = 'incoming',
  RETEST = 'retest-all-comment',
}

export enum TaskRunLabel {
  TARGET_PLATFORM = 'build.appstudio.redhat.com/target-platform',
}

export enum runStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'Starting',
  NeedsMerge = 'PR needs merge',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Cancelling = 'Cancelling',
  Pending = 'Pending',
  Idle = 'Idle',
  TestWarning = 'Test Warnings',
  TestFailed = 'Test Failures',
  Unknown = 'Unknown',
}

// Status priority for sorting - active states first, then errors, then completed
export const RUN_STATUS_PRIORITY: Record<string, number> = {
  [runStatus.Running]: 1,
  [runStatus['In Progress']]: 2,
  [runStatus.Pending]: 3,
  [runStatus.PipelineNotStarted]: 4,
  [runStatus.Idle]: 5,
  [runStatus.Cancelling]: 6,
  [runStatus.FailedToStart]: 7,
  [runStatus.Failed]: 8,
  [runStatus.TestFailed]: 9,
  [runStatus.TestWarning]: 10,
  [runStatus.NeedsMerge]: 11,
  [runStatus.Cancelled]: 12,
  [runStatus.Succeeded]: 13,
  [runStatus.Skipped]: 14,
  [runStatus.Unknown]: 15,
};

export enum SucceedConditionReason {
  PipelineRunStopped = 'StoppedRunFinally',
  PipelineRunCancelled = 'CancelledRunFinally',
  TaskRunCancelled = 'TaskRunCancelled',
  Cancelled = 'Cancelled',
  PipelineRunStopping = 'PipelineRunStopping',
  PipelineRunPending = 'PipelineRunPending',
  TaskRunStopping = 'TaskRunStopping',
  CreateContainerConfigError = 'CreateContainerConfigError',
  ExceededNodeResources = 'ExceededNodeResources',
  ExceededResourceQuota = 'ExceededResourceQuota',
  ConditionCheckFailed = 'ConditionCheckFailed',
}
