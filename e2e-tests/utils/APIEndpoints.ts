export const hacAPIEndpoints = {
  applications: (applicationName: string) =>
    `/api/k8s/apis/appstudio.redhat.com/v1alpha1/namespaces/${Cypress.env(
      'HAC_NAMESPACE',
    )}/applications/${applicationName}`,

  environments: (envName: string) =>
    `/api/k8s/apis/appstudio.redhat.com/v1alpha1/namespaces/${Cypress.env(
      'HAC_NAMESPACE',
    )}/environments/${envName}`,

  pipelinerunsFilter: (applicationName: string, label: string) =>
    `/api/k8s/apis/tekton.dev/v1beta1/namespaces/${Cypress.env(
      'HAC_NAMESPACE',
    )}/pipelineruns?labelSelector=appstudio.openshift.io/application=${applicationName},${label}&limit=250`,

  secrets: (secretName: string) =>
    `/api/k8s/api/v1/namespaces/${Cypress.env('HAC_NAMESPACE')}/secrets/${secretName}`,

  resources: (resourceType: string) =>
    `/api/k8s/apis/appstudio.redhat.com/v1beta1/namespaces/${Cypress.env(
      'HAC_NAMESPACE',
    )}/${resourceType}s`,
};

export const githubAPIEndpoints = {
  orgRepos: `https://api.github.com/orgs/redhat-hac-qe/repos`,
  testRepo: (owner: string, repoName: string) =>
    `https://api.github.com/repos/${owner}/${repoName}`,
  templateRepo: (owner: string, templateName: string) =>
    `https://api.github.com/repos/${owner}/${templateName}/generate`,
  merge: (owner: string, repoName: string, pullNumber: number) =>
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${pullNumber}/merge`,
  contents: (owner: string, repoName: string, filePath: string) =>
    `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
  commits: (owner: string, repoName: string) =>
    `https://api.github.com/repos/${owner}/${repoName}/commits`,
};
