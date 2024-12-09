export const addComponentPagePO = {
  samples: 'Start with a sample.',
  addComponent: '[data-test="add-component"] > a',
  enterSource: '[id="form-input-source-git-url-field"]',
  verifiedSource: '[class="pf-v5-c-form-control pf-m-success"]',
  gitOptions: 'Git options',
  gitReference: '[data-test="git-reference"]',
  contextDir: '[data-test="context-dir"]',
  next: 'button[type=submit]',
  cancel: 'button[type=reset]',
  componentCard: '[data-ouia-component-type="PF5/Card"]',
  toggleButton: '[id^="toggle"]',
  username: '[data-test="auth-username"]',
  token: '[data-test="auth-token"]',
  authenticateButton: '[data-test="authenticate-token"]',
  notValidatedMessage: 'Unable to access repository',
  useTokenButton: 'Use a token instead',
  privateInputId: '[id="form-checkbox-isPrivateRepo-field"]',
};

export const componentSamplesPagePO = {
  grid: '.catalog-page__grid',
  sample: (name: string) => `[data-test="${name}"]`,
  import: (name: string) => `[data-test="import-${name}"]`,
  nodejs: 'sample-Node',
  python: 'sample-Python',
  quarkus: 'sample-Quarkus',
  spring: 'sample-Spring Boot',
};

export const createApplicationPagePO = {
  applicationName: '[id="form-input-application-field"]',
  next: 'button[type=submit]',
  createApplication: 'Create application',
  addComponentButton: 'Add a component',
};

export const ComponentsPagePO = {
  appInput: '[data-test="app-name-field"] input',
  create: 'button[type=submit]',
  createText: 'Create application',
  componentNameField: '[id="form-input-componentName-field"]',
  checkIcon: '[data-test="check-icon"]',
  closeIcon: '[data-test="close-icon"]',
  showAdvancedSetting: 'Show advanced deployment options',
  cpuInput: 'input[name*="cpuValue"]',
  cpuPlusButton: 'button[data-ouia-component-id="OUIA-Generated-Button-control-2"]',
  cpuMinusButton: 'button[data-ouia-component-id="OUIA-Generated-Button-control-1"]',
  memoryInput: 'input[name*="memoryValue"]',
  dropdown: 'button[data-test="dropdown-toggle"]',
  replicaInput: 'input[id*="replicas-field"]',
  nameInput: '[data-test="pairs-list-name"][value=""]',
  valueInput: '[data-test="pairs-list-value"][value=""]',
  addEnvVar: '[data-test="add-button"]',
  loading: '[data-test="loading-indicator"]',
  saveButton: '[data-test="submit-button"]',
  editNameInput: '[data-test="editable-label-input"]',
  customBuildPipelineRadioBtn: '[for*="defaultBuildPipeline"] .pf-v5-c-switch__toggle',
  customBuildRequestedState: '[data-test="requested-state"]',
  label: '[class="pf-v5-c-label__content"]',
  customBuildPipelineModalCloseBtn: '[data-test="close-button custom-pipeline-modal"]',
  dockerfileInput: '[id="form-input-source-git-dockerfileUrl-field"]',
};

export const applicationDetailPagePO = {
  item: '[data-test="component-list-item-name"] > a > b',
  componentBuildLog: (param: string) => `[data-test="view-build-logs-${param}"]`,
  componentPodLog: (param: string) => `[data-test="view-pod-logs-${param}"]`,
  deploymentSettings: '[data-test="Edit deployment settings"]',
  detailsArrow: '[aria-label="Details"]',
  cpuRamLabel: 'CPU / Memory',
  replicaLabel: 'Instances',
  route: (param: string) => `[data-test-id="${param}-route"]`,
};

export const componentsListPagePO = {
  addComponent: '[pf-v5-c-button pf-m-primary]',
  applicationName: 'pf-v5-c-title pf-m-4xl hacDev-page__heading',
  items: '[pf-v5-c-data-list__item]',
};

export const buildLogModalContentPO = {
  modal: 'div[data-ouia-component-type="PF5/ModalContent"]',
  closeButton: '[aria-label="Close"]',
  logText: '[class="logs__content"]',
  logsTasklist: 'div[data-test="logs-tasklist"]',
  failedPipelineRunLogs: 'div[class="pipeline-run-logs"] [class*="pf-m-danger"]',
  podLogNavList: '[data-ouia-component-type="PF5/Nav"]',
};
