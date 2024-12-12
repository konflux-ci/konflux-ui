export const formPO = {
  create: 'button[type=submit]',
  cancel: '[data-test-id="reset-button"]',
};
export const alert = '.pf-v5-c-alert';
export const alertTitle = '.pf-v5-c-alert__title';

export const consentButton = '[id="truste-consent-button"]';

export const loginPO = {
  usernameForm: '.pf-c-login__main',
  username: '#rh-username-verification-form',
  nextButton: '#login-show-step2',
  passwordForm: '#login-show-step2',
  password: '#rh-password-verification-form',
  loginButton: '#rh-password-verification-submit-button',
};

export const kcLoginPO = {
  username: '#username',
  password: '#password',
  loginButton: '#kc-login',
};

export const waits = {
  loader: '.loader',
  spinner: '.pf-v5-c-spinner',
  gridPlaceholder: '.skeleton-catalog--tile',
  tablePlaceholder: '.loading-skeleton--table',
  viewPlaceholder: '[data-test="skeleton-detail-view"]',
  linkPlaceholder: '.pf-v5-c-skeleton',
};

export const actions = {
  kebabButton: '[data-test="kebab-button"]',
  delete: '[data-test="Delete"]',
  deleteApp: '[data-test="Delete application"]',
  deleteComponent: '[data-test="Delete component"]',
  deleteModalInput: 'input[name*="resourceName"]',
  deleteModalButton: 'button[data-test="delete-resource"]',
  editItem: '[data-test="Edit"]',
};

export const navigation = {
  sideNavigation: `[id="page-sidebar"]`,
  navigationItem: (link: string) => `[href*=${link}]`,
};

export const breadcrumb = {
  breadcrumbLink: 'nav[data-ouia-component-type="PF5/Breadcrumb"]',
};

export const UIhelperPO = {
  graphNode: 'g[data-kind="node"]',
  pipelineStatusSuccess: 'g[class="pf-topology-pipelines__pill-status pf-m-success"]',
  pipelineNode: 'g[class^="pf-topology__pipelines__task-node"]',
  tabs: 'div[data-ouia-component-type="PF5/Tabs"] button span',
  formGroup: 'div.pf-v5-c-form__group',
  formGroupLabelText: 'div.pf-v5-c-form__group span.pf-v5-c-form__label-text',
  listGroup_dt: 'div[class*="list__group"] dt',
  pf5_button: '[data-ouia-component-type="PF5/Button"]',
  tableRow: (tableAriaLabel: string) => `[aria-label="${tableAriaLabel}"] tr[role="row"]`,
  dropdownToggle: 'button[data-ouia-component-type="PF5/DropdownToggle"]',
};
