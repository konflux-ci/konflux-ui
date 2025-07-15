export enum SnapshotLabels {
  ITS_STATUS_ANNOTATION = `test.appstudio.openshift.io/status`,
  BUILD_PIPELINE_LABEL = `appstudio.openshift.io/build-pipelinerun`,
  PAC_SHA_LABEL = 'pac.test.appstudio.openshift.io/sha',
  PAC_SHA_TITLE_ANNOTATION = 'pac.test.appstudio.openshift.io/sha-title',
  PAC_SHA_URL_ANNOTATION = 'pac.test.appstudio.openshift.io/sha-url',
  PAC_SOURCE_REPO_URL_ANNOTATION = 'pac.test.appstudio.openshift.io/source-repo-url',
  PAC_EVENT_TYPE_LABEL = 'pac.test.appstudio.openshift.io/event-type',
  PAC_PULL_REQUEST_LABEL = 'pac.test.appstudio.openshift.io/pull-request',
  PAC_URL_ORG_LABEL = 'pac.test.appstudio.openshift.io/url-org',
  PAC_URL_REPOSITORY_LABEL = 'pac.test.appstudio.openshift.io/url-repository',
}
